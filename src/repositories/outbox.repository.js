const pool = require("../config/db");


// Create a new outbox event
const createOutboxEvent = async (
    eventType,
    routingKey,
    payload,
    client = pool
) => {

    const result = await client.query(
        `INSERT INTO outbox_events
        (
            event_type,
            routing_key,
            payload
        )
        VALUES ($1, $2, $3)
        RETURNING *`,
        [
            eventType,
            routingKey,
            payload
        ]
    );

    return result.rows[0];
};


// Get pending events while locking them
const getPendingOutboxEvents = async (
    client,
    limit = 100
) => {

    const result = await client.query(
        `SELECT *
         FROM outbox_events
         WHERE status = 'PENDING'
         ORDER BY created_at
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [limit]
    );

    return result.rows;
};


// Mark event as published
const markOutboxEventPublished = async (
    eventId,
    client = pool
) => {

    const result = await client.query(
        `UPDATE outbox_events
         SET
             status = 'PUBLISHED',
             published_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [eventId]
    );

    return result.rows[0];
};


module.exports = {
    createOutboxEvent,
    getPendingOutboxEvents,
    markOutboxEventPublished
};