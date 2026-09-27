

const findIdempotencyKey = async (userId, key, db) => {

    const result = await db.query(
        `SELECT
            id,
            user_id,
            key,
            transaction_id,
            status,
            response,
            created_at
         FROM idempotency_keys
         WHERE user_id = $1
         AND key = $2`,
        [userId, key]
    );

    return result.rows[0];
};

const createIdempotencyKey = async (
    userId,
    key,
    transactionId,
    status,
    response,
    db
) => {

    const result = await db.query(
        `INSERT INTO idempotency_keys
        (user_id, key, transaction_id, status, response)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            id,
            user_id,
            key,
            transaction_id,
            status,
            response,
            created_at`,
        [
            userId,
            key,
            transactionId,
            status,
            response
        ]
    );

    return result.rows[0];
};

module.exports = {
    findIdempotencyKey,
    createIdempotencyKey
};