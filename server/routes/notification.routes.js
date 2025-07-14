const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notification.controller');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.patch('/:id/read', authMiddleware, markAsRead);
router.patch('/mark-all/read', authMiddleware, markAllAsRead);

module.exports = router;
