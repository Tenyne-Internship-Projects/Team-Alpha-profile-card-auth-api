const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const {
  getFreelancerEarningsGraph,
  getFreelancerMetricsCards,
} = require("../controllers/freelancerDashboard.controller");

/**
 * @swagger
 * tags:
 *   name: Freelancer Dashboard
 *   description: Metrics and earnings overview for freelancers
 */

/**
 * @swagger
 * /api/freelancer-dashboard/metrics-cards:
 *   get:
 *     summary: Get freelancer metrics (cards)
 *     tags: [Freelancer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics data retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 totalEarnings: 3500
 *                 completedProjects: 12
 *                 ongoingProjects: 3
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  "/metrics-cards",
  verifyToken,
  authorizeRoles("freelancer"),
  getFreelancerMetricsCards
);

/**
 * @swagger
 * /api/freelancer-dashboard/earnings-graph:
 *   get:
 *     summary: Get freelancer earnings graph data
 *     tags: [Freelancer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: compareWithPrevious
 *         schema:
 *           type: boolean
 *         description: Whether to compare with the previous period
 *     responses:
 *       200:
 *         description: Graph data retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               currentPeriod:
 *                 - date: "2025-06-01"
 *                   amount: 200
 *                 - date: "2025-06-02"
 *                   amount: 300
 *               previousPeriod:
 *                 - date: "2025-05-01"
 *                   amount: 150
 *                 - date: "2025-05-02"
 *                   amount: 100
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get(
  "/earnings-graph",
  verifyToken,
  authorizeRoles("freelancer"),
  getFreelancerEarningsGraph
);

module.exports = router;
