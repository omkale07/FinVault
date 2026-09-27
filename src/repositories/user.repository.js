const pool = require("../config/db");

const findUserByEmail = async(email) =>{

const result = await pool.query("SELECT id, name, email, password_hash, role, is_verified FROM users WHERE email = $1", [email]);

return result.rows[0];

}

const createUser = async(name, email, passwordHash) =>{

    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, role, is_verified, created_at`,
        [name, email, passwordHash]
    );

    return result.rows[0];

}

const findUserById = async (userid) => {

    const result = await pool.query(
        `SELECT id, name, email, role, is_verified
         FROM users
         WHERE id = $1`,
        [userid]
    );

    return result.rows[0];
};

const updateUserProfile = async(userId, name, email) =>{

  const result = await pool.query(
    `UPDATE users SET name = $1,
    email = $2 WHERE
    id = $3
    RETURNING id, name, email, role, is_verified`
    ,[name, email, userId]
  );

  return result.rows[0];
};

const updatePassword = async(userId, passwordHash) =>{

    const result  = await pool.query(`
    UPDATE users set password_hash = $1 WHERE id = $2 RETURNING id`
    , [passwordHash, userId])

    return result.rows[0];
}

const findUserByIDWithPassword = async(userId) =>{

    const result = await pool.query(`
    SELECT id, password_hash FROM users WHERE id = $1`
    , [userId]);

    return result.rows[0];
}

const revokeAllUserSessions = async (userId) => {

    const result = await pool.query(
        `UPDATE device_sessions
         SET revoked_at = NOW()
         WHERE user_id = $1
         AND revoked_at IS NULL
         RETURNING id`,
        [userId]
    );

    return result.rows;
};

module.exports = {
    findUserByEmail,
    createUser,
    findUserById,
    updateUserProfile,
    updatePassword,
    findUserByIDWithPassword,
    revokeAllUserSessions
};