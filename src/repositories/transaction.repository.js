const pool = require("../config/db");


const createTransaction = async (
    walletId,
    type,
    amount,
    currency,
    status,
    referenceTransactionId = null
) => {

    const result = await pool.query(
        `INSERT INTO transactions
         (wallet_id, type, amount, currency, status, reference_transaction_id)
         VALUES ($1, $2, $3, $4, 'PENDING', $5)
         RETURNING id, wallet_id, type, amount, currency, status,
         reference_transaction_id, created_at, updated_at`,
        [
            walletId,
            type,
            amount,
            currency,
            referenceTransactionId
        ]
    );

    return result.rows[0];
};


const getTransactionsByWalletId = async (
    walletId,
    limit,
    offset
) => {

    const result = await pool.query(
        `SELECT
            id,
            wallet_id,
            type,
            amount,
            currency,
            status,
            created_at,
            updated_at
         FROM transactions
         WHERE wallet_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [
            walletId,
            limit,
            offset
        ]
    );

    return result.rows;
};


const findTransactionById = async (
    transactionId,
    walletId
) => {

    const result = await pool.query(
        `SELECT
            id,
            wallet_id,
            type,
            amount,
            currency,
            status,
            created_at,
            updated_at
         FROM transactions
         WHERE id = $1
         AND wallet_id = $2`,
        [
            transactionId,
            walletId
        ]
    );

    return result.rows[0];
};


const findUserTransactionHistory = async (
    userId,
    limit,
    offset,
    type,
    status,
    sort,
    order
) => {

    let query = `
        SELECT
            t.id,
            t.wallet_id,
            w.name AS wallet_name,
            t.type,
            t.amount,
            t.currency,
            t.status,
            t.created_at,
            t.updated_at
        FROM transactions t
        JOIN wallets w
            ON w.id = t.wallet_id
        WHERE w.user_id = $1
    `;

    const values = [
        userId,
        limit,
        offset
    ];

    if (type) {
        query += ` AND t.type = $${values.length + 1}`;
        values.push(type);
    }

    if (status) {
        query += ` AND t.status = $${values.length + 1}`;
        values.push(status);
    }

    const sortFields = {
        created_at: "t.created_at",
        amount: "t.amount"
    };

    const sortColumn =
        sortFields[sort] || "t.created_at";

    const sortOrder =
        String(order).toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

    query += `
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT $2
        OFFSET $3
    `;

    const result = await pool.query(
        query,
        values
    );

    return result.rows;
};


const findTransactionForProcessing = async (
    transactionId,
    db = pool
) => {

    const result = await db.query(
        `SELECT
            t.id,
            t.wallet_id,
            w.user_id,
            t.type,
            t.amount,
            t.currency,
            t.status,
            t.reference_transaction_id
         FROM transactions t
         JOIN wallets w
             ON w.id = t.wallet_id
         WHERE t.id = $1
         FOR UPDATE`,
        [transactionId]
    );

    return result.rows[0];
};


const updateTransactionStatus = async (
    transactionId,
    status,
    db = pool
) => {

    const result = await db.query(
        `UPDATE transactions
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING
             id,
             wallet_id,
             type,
             amount,
             currency,
             status,
             reference_transaction_id,
             created_at,
             updated_at`,
        [
            status,
            transactionId
        ]
    );

    return result.rows[0];
};


const createTransferTransactions = async (
    sourceWalletId,
    destinationWalletId,
    amount,
    currency,
    db
) => {

    const sourceResult = await db.query(
        `INSERT INTO transactions
         (wallet_id, type, amount, currency, status)
         VALUES ($1, 'TRANSFER', $2, $3, 'PENDING')
         RETURNING
             id,
             wallet_id,
             type,
             amount,
             currency,
             status,
             created_at,
             updated_at`,
        [
            sourceWalletId,
            amount,
            currency
        ]
    );

    const destinationResult = await db.query(
        `INSERT INTO transactions
         (wallet_id, type, amount, currency, status)
         VALUES ($1, 'TRANSFER', $2, $3, 'PENDING')
         RETURNING
             id,
             wallet_id,
             type,
             amount,
             currency,
             status,
             created_at,
             updated_at`,
        [
            destinationWalletId,
            amount,
            currency
        ]
    );

    return {
        sourceTransaction:
            sourceResult.rows[0],

        destinationTransaction:
            destinationResult.rows[0]
    };
};


const cancelTransaction = async (
    transactionId,
    walletId
) => {

    const result = await pool.query(
        `UPDATE transactions
         SET status = 'CANCELLED',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         AND wallet_id = $2
         AND status = 'PENDING'
         RETURNING
             id,
             wallet_id,
             type,
             amount,
             currency,
             status,
             reference_transaction_id,
             created_at,
             updated_at`,
        [
            transactionId,
            walletId
        ]
    );

    return result.rows[0];
};


const findTransactionWallet = async (
    transactionId
) => {

    const result = await pool.query(
        `SELECT wallet_id
         FROM transactions
         WHERE id = $1`,
        [transactionId]
    );

    return result.rows[0];
};


// Get stale pending transactions for expiration
const getExpiredPendingTransactions = async (
    client,
    limit = 100
) => {

    const result = await client.query(
        `SELECT *
         FROM transactions
         WHERE status = 'PENDING'
           AND created_at <
               CURRENT_TIMESTAMP - INTERVAL '30 minutes'
         ORDER BY created_at
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [limit]
    );

    return result.rows;
};


module.exports = {
    createTransaction,
    getTransactionsByWalletId,
    findTransactionById,
    findUserTransactionHistory,
    findTransactionForProcessing,
    updateTransactionStatus,
    createTransferTransactions,
    cancelTransaction,
    findTransactionWallet,
    getExpiredPendingTransactions
};