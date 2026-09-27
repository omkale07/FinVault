const pool = require("../config/db");


const createLedgerEntry = async (
    transactionId,
    walletId,
    entryType,
    amount,
    currency,
    db = pool
) => {

    const result = await db.query(
        `INSERT INTO ledger_entries
        (
            transaction_id,
            wallet_id,
            entry_type,
            amount,
            currency
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            id,
            transaction_id,
            wallet_id,
            entry_type,
            amount,
            currency,
            created_at`,
        [
            transactionId,
            walletId,
            entryType,
            amount,
            currency
        ]
    );

    return result.rows[0];
};


const getWalletBalance = async (
    walletId
) => {

    const result = await pool.query(
        `SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN entry_type = 'CREDIT'
                            THEN amount
                        WHEN entry_type = 'DEBIT'
                            THEN -amount
                        ELSE 0
                    END
                ),
                0
            ) AS balance,
            COALESCE(
                MAX(currency),
                'INR'
            ) AS currency
         FROM ledger_entries
         WHERE wallet_id = $1`,
        [walletId]
    );

    return result.rows[0];
};


const getWalletBalanceForUpdate = async (
    walletId,
    db
) => {

    const result = await db.query(
        `SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN entry_type = 'CREDIT'
                            THEN amount
                        WHEN entry_type = 'DEBIT'
                            THEN -amount
                        ELSE 0
                    END
                ),
                0
            ) AS balance
         FROM ledger_entries
         WHERE wallet_id = $1`,
        [walletId]
    );

    return result.rows[0];
};


module.exports = {
    createLedgerEntry,
    getWalletBalance,
    getWalletBalanceForUpdate
};