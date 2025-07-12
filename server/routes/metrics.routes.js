const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const {
  getClientProjectStatusMetrics,
} = require("../controllers/clientDashboard.controller");

/**
 * @swagger
 * tags:
 *   name: Client Dashboard
 *   description: Client-specific analytics and metrics
 */

/**
 * @swagger
 * /api/client-metrics/project-metrics:
 *   get:
 *     summary: Get project statistics for the authenticated client
 *     tags: [Client Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project metrics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     counts:
 *                       type: object
 *                       properties:
 *                         total: { type: number }
 *                         draft: { type: number }
 *                         ongoing: { type: number }
 *                         completed: { type: number }
 *                         cancelled: { type: number }
 *                         open: { type: number }
 *                         closed: { type: number }
 *                         active: { type: number }
 *                         archived: { type: number }
 *                     created:
 *                       type: object
 *                       properties:
 *                         last7Days: { type: number }
 *                         last30Days: { type: number }
 *                     budgetBuckets:
 *                       type: object
 *                       properties:
 *                         low: { type: number }
 *                         mid: { type: number }
 *                         high: { type: number }
 *       403:
 *         description: Unauthorized – only accessible to clients
 *       500:
 *         description: Server error
 */
router.get(
  "/project-metrics",
  verifyToken,
  authorizeRoles("client"),
  getClientProjectStatusMetrics
);

module.exports = router;
