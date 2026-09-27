const pool = require("../config/db");

const markEventProcessed = async (
    eventId,
    client = pool
) => {

    const result = await client.query(
        `INSERT INTO processed_events (event_id)
         VALUES ($1)
         ON CONFLICT (event_id)
         DO NOTHING
         RETURNING *`,
        [eventId]
    );

    return result.rows[0] || null;
};

module.exports = {
    markEventProcessed
};