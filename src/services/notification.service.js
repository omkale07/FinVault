const {
    getUserNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    getUnreadCount
} = require("../repositories/notification.repository");


// Get all notifications
const getNotifications = async (
    userId,
    limit = 20,
    offset = 0
) => {

    const [notifications, unreadCount] = await Promise.all([
        getUserNotifications(userId, limit, offset),
        getUnreadCount(userId)
    ]);

    return { notifications, unreadCount };
};


// Get unread notifications
const getUnread = async (
    userId,
    limit = 20,
    offset = 0
) => {

    const [notifications, unreadCount] = await Promise.all([
        getUnreadNotifications(userId, limit, offset),
        getUnreadCount(userId)
    ]);

    return { notifications, unreadCount };
};


// Mark notification as read
const markAsRead = async (
    notificationId,
    userId
) => {

    const notification =
        await markNotificationAsRead(
            notificationId,
            userId
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }

    return notification;
};


module.exports = {
    getNotifications,
    getUnread,
    markAsRead
};