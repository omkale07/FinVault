const pool = require("../config/db");


const createSession = async (
    userId,
    refreshTokenHash,
    tokenFamilyId,
    ipAddress,
    userAgent,
    expiresAt
) => {

    const result = await pool.query(
        `INSERT INTO device_sessions
        (
            user_id,
            refresh_token_hash,
            token_family_id,
            ip_address,
            user_agent,
            expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            user_id,
            token_family_id,
            expires_at,
            created_at`,
        [
            userId,
            refreshTokenHash,
            tokenFamilyId,
            ipAddress,
            userAgent,
            expiresAt
        ]
    );

    return result.rows[0];
};


const findSessionByRefreshTokenHash = async (
    refreshTokenHash
) => {

    const result = await pool.query(
        `SELECT
            id,
            user_id,
            refresh_token_hash,
            token_family_id,
            expires_at,
            revoked_at,
            created_at,
            last_used_at
         FROM device_sessions
         WHERE refresh_token_hash = $1`,
        [refreshTokenHash]
    );

    return result.rows[0];
};


const rotateRefreshToken = async (
    sessionId,
    newRefreshTokenHash
) => {

    const result = await pool.query(
        `UPDATE device_sessions
         SET
            refresh_token_hash = $1,
            last_used_at = NOW()
         WHERE id = $2
         RETURNING
            id,
            user_id,
            token_family_id,
            expires_at,
            revoked_at,
            last_used_at`,
        [
            newRefreshTokenHash,
            sessionId
        ]
    );

    return result.rows[0];
};


const revokeSession = async (
    sessionId
) => {

    const result = await pool.query(
        `UPDATE device_sessions
         SET revoked_at = NOW()
         WHERE id = $1
         RETURNING
            id,
            revoked_at`,
        [sessionId]
    );

    return result.rows[0];
};


module.exports = {
    createSession,
    findSessionByRefreshTokenHash,
    rotateRefreshToken,
    revokeSession
};