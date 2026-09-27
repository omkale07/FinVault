const pool = require("../config/db");


const getAllUsers = async (limit, offset) => {

    const countResult = await pool.query(
        `SELECT COUNT(*) 
         FROM users`
    );

    const result = await pool.query(
        `SELECT id, name, email, role, is_verified, created_at, updated_at
         FROM users
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return {
        count: parseInt(countResult.rows[0].count),
        users: result.rows
    };
};


const getAllWallets = async (limit, offset) => {

    const countResult = await pool.query(
        `SELECT COUNT(*)
         FROM wallets`
    );

    const result = await pool.query(
        `SELECT
            w.id,
            w.user_id,
            w.name,
            w.currency,
            w.status,
            w.created_at,
            w.updated_at,
            u.name AS user_name,
            u.email AS user_email
         FROM wallets w
         JOIN users u ON w.user_id = u.id
         ORDER BY w.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return {
        count: parseInt(countResult.rows[0].count),
        wallets: result.rows
    };
};


const getAllTransactions = async (limit, offset) => {

    const countResult = await pool.query(
        `SELECT COUNT(*)
         FROM transactions`
    );

    const result = await pool.query(
        `SELECT
            t.id,
            t.wallet_id,
            t.type,
            t.amount,
            t.currency,
            t.status,
            t.reference_transaction_id,
            t.created_at,
            t.updated_at,

            w.user_id,
            w.name AS wallet_name,

            u.name AS user_name,
            u.email AS user_email

         FROM transactions t

         JOIN wallets w
             ON t.wallet_id = w.id

         JOIN users u
             ON w.user_id = u.id

         ORDER BY t.created_at DESC

         LIMIT $1
         OFFSET $2`,
        [limit, offset]
    );

    return {
        count: parseInt(countResult.rows[0].count),
        transactions: result.rows
    };
};

module.exports = {
    getAllUsers,
    getAllWallets,
    getAllTransactions
};