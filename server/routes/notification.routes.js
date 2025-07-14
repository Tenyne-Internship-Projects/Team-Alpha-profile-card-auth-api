const express = require("express");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require("../controllers/notification.controller");

const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.get("/unread-count", verifyToken, getUnreadCount);
router.patch("/:id/read", verifyToken, markAsRead);
router.patch("/mark-all/read", verifyToken, markAllAsRead);

module.exports = router;
