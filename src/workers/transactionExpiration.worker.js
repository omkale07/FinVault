const pool = require("../config/db");

const {
    getExpiredPendingTransactions,
    updateTransactionStatus
} = require("../repositories/transaction.repository");

const {
    createAuditLog
} = require("../repositories/audit.repository");


// -----------------------------------------
// Worker
// -----------------------------------------

const startTransactionExpirationWorker = async () => {

    console.log(
        "FinVault Transaction Expiration Worker started..."
    );

    while (true) {

        let client;

        try {

            client = await pool.connect();

            await client.query("BEGIN");

            // Find stale PENDING transactions
            const transactions =
                await getExpiredPendingTransactions(
                    client,
                    100
                );

            // Nothing to process
            if (transactions.length === 0) {

                await client.query("ROLLBACK");

            } else {

                // Process transactions
                for (const transaction of transactions) {

                    console.log(
                        `Expiring transaction ${transaction.id}`
                    );

                    // PENDING → EXPIRED
                    await updateTransactionStatus(
                        transaction.id,
                        "EXPIRED",
                        client
                    );

                    // Create audit log
                    await createAuditLog(
                        transaction.user_id,
                        "TRANSACTION_EXPIRED",
                        "TRANSACTION",
                        transaction.id,
                        {
                            walletId:
                                transaction.wallet_id,

                            amount:
                                transaction.amount,

                            currency:
                                transaction.currency,

                            reason:
                                "Transaction remained PENDING for more than 30 minutes"
                        },
                        client
                    );

                    console.log(
                        `Transaction ${transaction.id} expired successfully`
                    );
                }

                await client.query("COMMIT");

                console.log(
                    `Expired ${transactions.length} transaction(s)`
                );
            }

        } catch (error) {

            if (client) {

                try {

                    await client.query("ROLLBACK");

                } catch (rollbackError) {

                    console.error(
                        "Rollback failed:",
                        rollbackError.message
                    );
                }
            }

            console.error(
                "Transaction expiration worker error:",
                error.message
            );

        } finally {

            if (client) {
                client.release();
            }
        }

        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        );
    }
};

module.exports = {
    startTransactionExpirationWorker
};