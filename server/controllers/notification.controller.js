const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all notifications for a user 
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userInfo.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
};

// Mark a single notification as read 
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.status(200).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

// Mark all notifications as read 
const markAllAsRead = async (req, res) => {
  try {
    const updated = await prisma.notification.updateMany({
      where: {
        userId: req.userInfo.id,
        read: false
      },
      data: { read: true }
    });

    res.status(200).json({ success: true, updatedCount: updated.count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};

// Get unread notification count 
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.userInfo.id,
        read: false
      }
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
