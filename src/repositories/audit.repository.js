const pool = require('../config/db');

const createAuditLog = async (
    userId,
    action,
    entityType = null,
    entityId = null,
    metadata = null,
    db = pool
) => {

    const result = await db.query(
        `INSERT INTO audit_logs
        (
            user_id,
            action,
            entity_type,
            entity_id,
            metadata
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            id,
            user_id,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at`,
        [
            userId,
            action,
            entityType,
            entityId,
            metadata
        ]
    );

    return result.rows[0];
};

const getAuditLogsByUserId = async (
  userId,
  limit,
  offset,
  action,
  entityType
) => {

  let query = `
    SELECT
      id,
      user_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    FROM audit_logs
    WHERE user_id = $1
  `;

  const values = [userId];

  if (action) {
    query += ` AND action = $${values.length + 1}`;
    values.push(action);
  }

  if (entityType) {
    query += ` AND entity_type = $${values.length + 1}`;
    values.push(entityType);
  }

  query += `
    ORDER BY created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  values.push(limit, offset);

  const result = await pool.query(query, values);

  return result.rows;
};


const getAllAuditLogs = async (
    limit,
    offset,
    action,
    entityType
) => {

    let query = `
        SELECT
            id,
            user_id,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at
        FROM audit_logs
        WHERE 1 = 1
    `;

    const values = [];

    if (action) {
        query += ` AND action = $${values.length + 1}`;
        values.push(action);
    }

    if (entityType) {
        query += ` AND entity_type = $${values.length + 1}`;
        values.push(entityType);
    }

    query += `
        ORDER BY created_at DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    return result.rows;
};

module.exports = {
    createAuditLog,
    getAuditLogsByUserId,
    getAllAuditLogs
};