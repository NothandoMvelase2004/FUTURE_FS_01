const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");

// All notification endpoints require administrator authentication.
router.use(authMiddleware);

// Retrieve notification history.
router.get("/", getNotifications);

// Retrieve unread count.
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read.
router.patch("/read-all", markAllAsRead);

// Mark one notification as read.
router.patch("/:id/read", markAsRead);

// Delete a notification.
router.delete("/:id", deleteNotification);

module.exports = router;