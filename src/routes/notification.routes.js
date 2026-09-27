const express = require("express");

const {
    getAllNotifications,
    getUnreadNotifications,
    readNotification
} = require("../controllers/notification.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const router = express.Router();


// Get all notifications
router.get(
    "/",
    authMiddleware,
    getAllNotifications
);


// Get unread notifications
router.get(
    "/unread",
    authMiddleware,
    getUnreadNotifications
);


// Mark notification as read
router.patch(
    "/:id/read",
    authMiddleware,
    readNotification
);


module.exports = router;