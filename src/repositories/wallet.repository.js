const pool = require('../config/db');

const createWallet = async(userId, name, currency) =>{

    const result = await pool.query(`
        INSERT INTO wallets (user_id, name, currency) 
        VALUES ($1, $2, $3)
        RETURNING id, user_id, name, currency, status, created_at, updated_at`
        , [userId, name, currency])

        return result.rows[0];
};

const findWalletByUserId = async(userId) =>{

    const result = await pool.query(
       `SELECT id, user_id, name, currency, status, created_at, updated_at 
        FROM wallets WHERE user_id = $1 ORDER BY id`,
        [userId]
    );

    return result.rows;
}

const findWalletByWalletId = async(walletId, userId) =>{

    const result = await pool.query(
        `SELECT id, user_id, name, currency, status, created_at, updated_at
         FROM wallets
         WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
    );

    return result.rows[0];
}

const updateWallet = async (walletId, userId, name, currency) => {

    const result = await pool.query(
        `UPDATE wallets
        SET name = $1,
        currency = $2,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        AND user_id = $4
        RETURNING id, user_id, name, currency, status, created_at, updated_at`,
        [name, currency, walletId, userId]
    );

    return result.rows[0];
};

const deleteWallet = async (walletId, userId) => {

    const result = await pool.query(
        `DELETE FROM wallets
         WHERE id = $1
           AND user_id = $2
         RETURNING id, user_id, name`,
        [walletId, userId]
    );

    return result.rows[0];
};

const lockWallet = async (walletId, db) => {

    const result = await db.query(
        `SELECT id, user_id, name, currency, status
         FROM wallets
         WHERE id = $1
         FOR UPDATE`,
        [walletId]
    );

    return result.rows[0];
};



module.exports = {
    createWallet,
    findWalletByUserId,
    findWalletByWalletId,
    updateWallet,
    deleteWallet,
    lockWallet
};