const {
    getUserNotifications,
    getUnreadNotifications,
    markNotificationAsRead
} = require("../repositories/notification.repository");


// Get all notifications
const getNotifications = async (
    userId,
    limit = 20,
    offset = 0
) => {

    return await getUserNotifications(
        userId,
        limit,
        offset
    );
};


// Get unread notifications
const getUnread = async (
    userId,
    limit = 20,
    offset = 0
) => {

    return await getUnreadNotifications(
        userId,
        limit,
        offset
    );
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