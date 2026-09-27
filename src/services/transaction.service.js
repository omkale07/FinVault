const pool = require("../config/db");

const {
    findTransactionForProcessing,
    updateTransactionStatus,
    createTransferTransactions,
    findTransactionWallet
} = require("../repositories/transaction.repository");

const {
    createLedgerEntry,
    getWalletBalanceForUpdate
} = require("../repositories/ledger.repository");

const {
    findIdempotencyKey,
    createIdempotencyKey
} = require("../repositories/idempotency.repository");

const {
    acquireLock,
    releaseLock
} = require("../utils/redisLock");

const {
    deleteCache
} = require("../utils/redisCache");

const {
    lockWallet
} = require("../repositories/wallet.repository");

const {
    createAuditLog
} = require("../repositories/audit.repository");

const {
    createOutboxEvent
} = require("../repositories/outbox.repository");


const processTransaction = async (
    transactionId,
    userId,
    idempotencyKey
) => {

    userId = Number(userId);

    // Find which wallet this transaction belongs to
    const transactionInfo =
        await findTransactionWallet(transactionId);

    if (!transactionInfo) {
        throw new Error("Transaction not found");
    }

    const walletId = Number(
        transactionInfo.wallet_id
    );

    // Create Redis lock key
    const lockKey = `wallet:${walletId}:lock`;

    // Try to acquire Redis lock
    const lockToken = await acquireLock(
        lockKey,
        30
    );

    if (!lockToken) {
        throw new Error(
            "Wallet is currently being processed"
        );
    }

    const client = await pool.connect();

    let transactionCommitted = false;

    try {

        await client.query("BEGIN");

        // 1. Check idempotency
        const existingKey = await findIdempotencyKey(
            userId,
            idempotencyKey,
            client
        );

        if (existingKey) {

            if (
                Number(existingKey.transaction_id) !==
                Number(transactionId)
            ) {
                throw new Error(
                    "Idempotency key already used for another transaction"
                );
            }

            await client.query("ROLLBACK");

            return existingKey.response;
        }

        // 2. Find and lock transaction
        const transaction =
            await findTransactionForProcessing(
                transactionId,
                client
            );

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        // 3. Transaction must be pending
        if (transaction.status !== "PENDING") {
            throw new Error(
                "Transaction has already been processed"
            );
        }

        // 4. Check transaction ownership
        if (
            Number(transaction.user_id) !== userId
        ) {
            throw new Error(
                "Transaction access denied"
            );
        }

        // 5. Lock wallet
        const wallet = await lockWallet(
            transaction.wallet_id,
            client
        );

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        // 6. Handle withdrawal balance
        if (transaction.type === "WITHDRAW") {

            const balanceResult =
                await getWalletBalanceForUpdate(
                    transaction.wallet_id,
                    client
                );

            const balance = Number(
                balanceResult.balance
            );

            const amount = Number(
                transaction.amount
            );

            if (amount > balance) {

                // Mark transaction as FAILED
                await updateTransactionStatus(
                    transaction.id,
                    "FAILED",
                    client
                );

                // Create audit log
                await createAuditLog(
                    userId,
                    "TRANSACTION_FAILED",
                    "TRANSACTION",
                    transaction.id,
                    {
                        type: transaction.type,
                        amount: transaction.amount,
                        currency: transaction.currency,
                        reason:
                            "Insufficient wallet balance"
                    },
                    client
                );

                // Create outbox event
                await createOutboxEvent(
                    "TRANSACTION_FAILED",
                    "transaction.failed",
                    {
                        event: "TRANSACTION_FAILED",
                        transactionId: transaction.id,
                        walletId: transaction.wallet_id,
                        userId: transaction.user_id,
                        type: transaction.type,
                        amount: transaction.amount,
                        currency: transaction.currency,
                        reason:
                            "Insufficient wallet balance"
                    },
                    client
                );

                // Save FAILED status and event
                await client.query("COMMIT");

                transactionCommitted = true;

                throw new Error(
                    "Insufficient wallet balance"
                );
            }
        }

        // 7. Determine ledger entry type
        let entryType;

        if (transaction.type === "DEPOSIT") {

            entryType = "CREDIT";

        } else if (transaction.type === "WITHDRAW") {

            entryType = "DEBIT";

        } else if (
            transaction.type === "REFUND" ||
            transaction.type === "REVERSAL"
        ) {

            if (!transaction.reference_transaction_id) {
                throw new Error(
                    "Reference transaction is required"
                );
            }

            const referenceResult =
                await client.query(
                    `SELECT
                        id,
                        wallet_id,
                        type,
                        amount,
                        currency,
                        status
                     FROM transactions
                     WHERE id = $1
                     FOR UPDATE`,
                    [
                        transaction.reference_transaction_id
                    ]
                );

            const referenceTransaction =
                referenceResult.rows[0];

            if (!referenceTransaction) {
                throw new Error(
                    "Reference transaction not found"
                );
            }

            if (
                referenceTransaction.status !==
                "COMPLETED"
            ) {
                throw new Error(
                    "Reference transaction must be completed"
                );
            }

            if (
                Number(
                    referenceTransaction.wallet_id
                ) !==
                Number(transaction.wallet_id)
            ) {
                throw new Error(
                    "Reference transaction belongs to another wallet"
                );
            }

            if (
                referenceTransaction.currency !==
                transaction.currency
            ) {
                throw new Error(
                    "Reference transaction currency mismatch"
                );
            }

            if (
                Number(
                    referenceTransaction.amount
                ) !==
                Number(transaction.amount)
            ) {
                throw new Error(
                    "Refund or reversal amount must match reference transaction"
                );
            }

            // Reverse the original ledger effect
            if (
                referenceTransaction.type ===
                "DEPOSIT"
            ) {

                entryType = "DEBIT";

            } else if (
                referenceTransaction.type ===
                "WITHDRAW"
            ) {

                entryType = "CREDIT";

            } else {

                throw new Error(
                    "Reference transaction type cannot be refunded or reversed"
                );
            }

        } else if (transaction.type === "TRANSFER") {

            throw new Error(
                "Transfers must be processed using transfer endpoint"
            );

        } else {

            throw new Error(
                "Unsupported transaction type"
            );
        }

        // 8. Create ledger entry
        const ledgerEntry =
            await createLedgerEntry(
                transaction.id,
                transaction.wallet_id,
                entryType,
                transaction.amount,
                transaction.currency,
                client
            );

        // 9. Mark transaction completed
        await updateTransactionStatus(
            transaction.id,
            "COMPLETED",
            client
        );

        // Create audit log
        await createAuditLog(
            userId,
            "TRANSACTION_COMPLETED",
            "TRANSACTION",
            transaction.id,
            {
                type: transaction.type,
                amount: transaction.amount,
                currency: transaction.currency
            },
            client
        );

        // 10. Save idempotency response
        await createIdempotencyKey(
            userId,
            idempotencyKey,
            transaction.id,
            "COMPLETED",
            ledgerEntry,
            client
        );

        // Create outbox event
        await createOutboxEvent(
            "TRANSACTION_COMPLETED",
            "transaction.completed",
            {
                event: "TRANSACTION_COMPLETED",
                transactionId: transaction.id,
                walletId: transaction.wallet_id,
                userId: transaction.user_id,
                type: transaction.type,
                amount: transaction.amount,
                currency: transaction.currency
            },
            client
        );

        // 11. Commit everything
        await client.query("COMMIT");

        transactionCommitted = true;

        await deleteCache(
            `wallet:${walletId}:balance`
        );

        return ledgerEntry;

    } catch (error) {

        // Don't rollback if we already committed
        if (!transactionCommitted) {
            await client.query("ROLLBACK");
        }

        throw error;

    } finally {

        client.release();

        await releaseLock(
            lockKey,
            lockToken
        );
    }
};


const transferFunds = async (
    sourceWalletId,
    destinationWalletId,
    amount,
    currency,
    userId,
    idempotencyKey
) => {

    userId = Number(userId);

    // Put wallet IDs in a fixed order
    const firstWalletId = Math.min(
        Number(sourceWalletId),
        Number(destinationWalletId)
    );

    const secondWalletId = Math.max(
        Number(sourceWalletId),
        Number(destinationWalletId)
    );

    // Redis lock keys
    const firstLockKey =
        `wallet:${firstWalletId}:lock`;

    const secondLockKey =
        `wallet:${secondWalletId}:lock`;

    // Acquire first wallet lock
    const firstLockToken = await acquireLock(
        firstLockKey,
        30
    );

    if (!firstLockToken) {
        throw new Error(
            "Wallet is currently being processed"
        );
    }

    // Acquire second wallet lock
    const secondLockToken = await acquireLock(
        secondLockKey,
        30
    );

    if (!secondLockToken) {

        // Release first lock before failing
        await releaseLock(
            firstLockKey,
            firstLockToken
        );

        throw new Error(
            "Wallet is currently being processed"
        );
    }

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        // Check idempotency
        const existingKey =
            await findIdempotencyKey(
                userId,
                idempotencyKey,
                client
            );

        if (existingKey) {

            await client.query("ROLLBACK");

            return existingKey.response;
        }

        if (
            Number(sourceWalletId) ===
            Number(destinationWalletId)
        ) {
            throw new Error(
                "Cannot transfer to the same wallet"
            );
        }

        const firstWallet =
            await lockWallet(
                firstWalletId,
                client
            );

        const secondWallet =
            await lockWallet(
                secondWalletId,
                client
            );

        if (!firstWallet || !secondWallet) {
            throw new Error(
                "Wallet not found"
            );
        }

        const sourceWallet =
            Number(firstWallet.id) ===
            Number(sourceWalletId)
                ? firstWallet
                : secondWallet;

        const destinationWallet =
            Number(firstWallet.id) ===
            Number(destinationWalletId)
                ? firstWallet
                : secondWallet;

        if (
            Number(sourceWallet.user_id) !==
            userId
        ) {
            throw new Error(
                "Transaction access denied"
            );
        }

        if (sourceWallet.status !== "ACTIVE") {
            throw new Error(
                "Source wallet is not active"
            );
        }

        if (
            destinationWallet.status !==
            "ACTIVE"
        ) {
            throw new Error(
                "Destination wallet is not active"
            );
        }

        const normalizedCurrency =
            currency.toUpperCase();

        if (
            sourceWallet.currency !==
            normalizedCurrency
        ) {
            throw new Error(
                "Source wallet currency mismatch"
            );
        }

        if (
            destinationWallet.currency !==
            normalizedCurrency
        ) {
            throw new Error(
                "Destination wallet currency mismatch"
            );
        }

        const balanceResult =
            await getWalletBalanceForUpdate(
                sourceWallet.id,
                client
            );

        const balance = Number(
            balanceResult.balance
        );

        const transferAmount = Number(amount);

        if (transferAmount > balance) {
            throw new Error(
                "Insufficient wallet balance"
            );
        }

        const transactions =
            await createTransferTransactions(
                sourceWallet.id,
                destinationWallet.id,
                transferAmount,
                normalizedCurrency,
                client
            );

        const debitEntry =
            await createLedgerEntry(
                transactions.sourceTransaction.id,
                sourceWallet.id,
                "DEBIT",
                transferAmount,
                normalizedCurrency,
                client
            );

        const creditEntry =
            await createLedgerEntry(
                transactions.destinationTransaction.id,
                destinationWallet.id,
                "CREDIT",
                transferAmount,
                normalizedCurrency,
                client
            );

        const completedSourceTransaction =
            await updateTransactionStatus(
                transactions.sourceTransaction.id,
                "COMPLETED",
                client
            );

        const completedDestinationTransaction =
            await updateTransactionStatus(
                transactions.destinationTransaction.id,
                "COMPLETED",
                client
            );

        await createAuditLog(
            userId,
            "TRANSFER_COMPLETED",
            "TRANSACTION",
            transactions.sourceTransaction.id,
            {
                sourceWalletId: sourceWallet.id,
                destinationWalletId:
                    destinationWallet.id,
                amount: transferAmount,
                currency: normalizedCurrency
            },
            client
        );

        const response = {
            sourceTransaction:
                completedSourceTransaction,

            destinationTransaction:
                completedDestinationTransaction,

            debitEntry,
            creditEntry
        };

        await createIdempotencyKey(
            userId,
            idempotencyKey,
            transactions.sourceTransaction.id,
            "COMPLETED",
            response,
            client
        );

        await client.query("COMMIT");

        await deleteCache(
            `wallet:${sourceWalletId}:balance`
        );

        await deleteCache(
            `wallet:${destinationWalletId}:balance`
        );

        return response;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();

        await releaseLock(
            secondLockKey,
            secondLockToken
        );

        await releaseLock(
            firstLockKey,
            firstLockToken
        );
    }
};


module.exports = {
    processTransaction,
    transferFunds
};