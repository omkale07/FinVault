const pool = require("../config/db");


// Create notification
const createNotification = async (
    userId,
    type,
    title,
    message,
    transactionId = null,
    client = pool
) => {

    const result = await client.query(
        `INSERT INTO notifications
        (
            user_id,
            type,
            title,
            message,
            transaction_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
            userId,
            type,
            title,
            message,
            transactionId
        ]
    );

    return result.rows[0];
};


// Get all notifications for a user
const getUserNotifications = async (
    userId,
    limit = 20,
    offset = 0
) => {

    const result = await pool.query(
        `SELECT *
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2
         OFFSET $3`,
        [
            userId,
            limit,
            offset
        ]
    );

    return result.rows;
};


// Get unread notifications
const getUnreadNotifications = async (
    userId,
    limit = 20,
    offset = 0
) => {

    const result = await pool.query(
        `SELECT *
         FROM notifications
         WHERE user_id = $1
           AND is_read = FALSE
         ORDER BY created_at DESC
         LIMIT $2
         OFFSET $3`,
        [
            userId,
            limit,
            offset
        ]
    );

    return result.rows;
};


// Mark notification as read
const markNotificationAsRead = async (
    notificationId,
    userId
) => {

    const result = await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = $1
           AND user_id = $2
         RETURNING *`,
        [
            notificationId,
            userId
        ]
    );

    return result.rows[0] || null;
};


// Get unread count
const getUnreadCount = async (userId) => {
    const result = await pool.query(
        `SELECT COUNT(*)
         FROM notifications
         WHERE user_id = $1
           AND is_read = FALSE`,
        [userId]
    );
    return parseInt(result.rows[0].count, 10) || 0;
};

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    getUnreadCount
};