const {
    getNotifications,
    getUnread,
    markAsRead
} = require("../services/notification.service");


// GET /api/notifications
const getAllNotifications = async (req, res, next) => {

    try {

        const userId = Number(req.user.sub);

        const limit = Math.min(
            Number(req.query.limit) || 20,
            100
        );

        const offset = Math.max(
            Number(req.query.offset) || 0,
            0
        );

        const notifications = await getNotifications(
            userId,
            limit,
            offset
        );

        return res.status(200).json({
            success: true,
            notifications
        });

    } catch (error) {
        next(error);
    }
};


// GET /api/notifications/unread
const getUnreadNotifications = async (
    req,
    res,
    next
) => {

    try {

        const userId = Number(req.user.sub);

        const limit = Math.min(
            Number(req.query.limit) || 20,
            100
        );

        const offset = Math.max(
            Number(req.query.offset) || 0,
            0
        );

        const notifications = await getUnread(
            userId,
            limit,
            offset
        );

        return res.status(200).json({
            success: true,
            notifications
        });

    } catch (error) {
        next(error);
    }
};


// PATCH /api/notifications/:id/read
const readNotification = async (
    req,
    res,
    next
) => {

    try {

        const notificationId =
            Number(req.params.id);

        const userId =
            Number(req.user.sub);

        if (
            !Number.isInteger(notificationId) ||
            notificationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        const notification = await markAsRead(
            notificationId,
            userId
        );

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    getAllNotifications,
    getUnreadNotifications,
    readNotification
};