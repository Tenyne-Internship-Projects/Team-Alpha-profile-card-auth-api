const express = require("express");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Endpoints for managing user notifications
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - message
 *         - isRead
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: The notification ID
 *         userId:
 *           type: string
 *           description: ID of the user who owns the notification
 *         message:
 *           type: string
 *           description: The message content of the notification
 *         isRead:
 *           type: boolean
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Time the notification was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Time the notification was last updated
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/", verifyToken, getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get the count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of unread notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *                   example: 3
 */
router.get("/unread-count", verifyToken, getUnreadCount);

/**
 * @swagger
 * /api/notifications/mark-all/read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put("/mark-all/read", verifyToken, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the notification
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.put("/:id/read", verifyToken, markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the notification
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */
router.delete("/:id", verifyToken, deleteNotification);

module.exports = router;
