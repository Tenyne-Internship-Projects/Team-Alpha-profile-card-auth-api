const express = require("express");
const router = express.Router();

const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const {
  getFreelancerEarningsGraph,
  getFreelancerMetricsCards,
  getFreelancerVisitStats,
} = require("../controllers/freelancerDashboard.controller");

/**
 * @swagger
 * tags:
 *   name: Freelancer Dashboard
 *   description: Metrics, earnings, and visit stats for freelancers
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
 *             schema:
 *               type: object
 *               properties:
 *                 freelancerId:
 *                   type: string
 *                   example: da8315b6-135c-4ee5-9b88-e052725a6538
 *                 projectStats:
 *                   type: object
 *                   properties:
 *                     completed:
 *                       type: integer
 *                       example: 5
 *                     ongoing:
 *                       type: integer
 *                       example: 2
 *                     cancelled:
 *                       type: integer
 *                       example: 1
 *                 applicationStats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     pending:
 *                       type: integer
 *                       example: 3
 *                     approved:
 *                       type: integer
 *                       example: 5
 *                     rejected:
 *                       type: integer
 *                       example: 2
 *                 projects:
 *                   type: array
 *                   description: Approved and non-deleted projects
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: b3a91302-4ee0-420f-bb87-df7aa1fef567
 *                       title:
 *                         type: string
 *                         example: "Landing Page Redesign"
 *                       progressStatus:
 *                         type: string
 *                         example: "ongoing"
 *                       deleted:
 *                         type: boolean
 *                         example: false
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
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter earnings by year (e.g. 2025)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter earnings by month (1-12)
 *       - in: query
 *         name: compare
 *         schema:
 *           type: boolean
 *         description: Whether to compare with previous year (true/false)
 *     responses:
 *       200:
 *         description: Graph data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 freelancerId:
 *                   type: string
 *                   example: da8315b6-135c-4ee5-9b88-e052725a6538
 *                 monthlyEarnings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2025-07"
 *                       total:
 *                         type: number
 *                         example: 7000
 *                 previousYearComparison:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2024-07"
 *                       total:
 *                         type: number
 *                         example: 6000
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

/**
 * @swagger
 * /api/freelancer-dashboard/profile-visits/{userId}:
 *   get:
 *     summary: Get total profile visits (only by the freelancer)
 *     tags: [Freelancer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the freelancer (must match the logged-in user)
 *     responses:
 *       200:
 *         description: Visit data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalVisits:
 *                   type: integer
 *                   example: 23
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Trying to access another user's stats
 */
router.get(
  "/profile-visits/:userId",
  verifyToken,
  authorizeRoles("freelancer"),
  getFreelancerVisitStats
);

module.exports = router;
