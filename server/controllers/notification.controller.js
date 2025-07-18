const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            fullname: true,
            email: true,
            role: true,
            freelancerProfile: {
              select: {
                avatarUrl: true,
                profession: true,
              },
            },
            clientProfile: {
              select: {
                companyName: true,
                companyLogo: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (err) {
    console.error("Error getting notifications:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
};

// Mark a single notification as read, but ensure it belongs to the current user
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });

    if (notification.userId !== req.user.userId)
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.status(200).json({
      success: true,
      notification: updatedNotification,
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// Mark all notifications as read for the current user
const markAllAsRead = async (req, res) => {
  try {
    const updated = await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        read: false,
      },
      data: { read: true },
    });

    res.status(200).json({
      success: true,
      updatedCount: updated.count,
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({
      success: false,
      message: "Failed to mark all as read",
    });
  }
};

// Get the unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        read: false,
      },
    });

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    console.error("Error getting unread notification count:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

// Delete a single notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    if (notification.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};
