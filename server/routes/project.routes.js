const express = require("express");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  completeProject,
  updateProjectProgress,
} = require("../controllers/project.controller");

const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const {
  getAllClientProjects,
} = require("../controllers/clientDashboard.controller");

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints for clients and freelancers
 */

/**
 * @swagger
 * /api/project/create/{clientId}:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the client creating the project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - budget
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: integer
 *               deadline:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirement:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Client not found
 */
router.post(
  "/create/:clientId",
  verifyToken,
  authorizeRoles("client"),
  createProject
);

/**
 * @swagger
 * /api/project:
 *   get:
 *     summary: Get all open projects (for freelancers/public)
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minBudget
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxBudget
 *         schema:
 *           type: number
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           description: Comma-separated tags
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get("/", getAllProjects);

/**
 * @swagger
 * /api/project/my-projects:
 *   get:
 *     summary: Get all projects created by the authenticated client
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/my-projects",
  verifyToken,
  authorizeRoles("client"),
  getAllClientProjects
);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Get a single project by its ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project data retrieved
 *       404:
 *         description: Project not found
 */
router.get("/:id", verifyToken, getProjectById);

/**
 * @swagger
 * /api/project/{id}:
 *   put:
 *     summary: Update a project (client only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               deadline:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Unauthorized
 */
router.put("/:id", verifyToken, authorizeRoles("client"), updateProject);

/**
 * @swagger
 * /api/project/{id}/complete:
 *   put:
 *     summary: Mark a project as completed and trigger payment (client only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project marked as completed and paid
 *       400:
 *         description: Already completed or no approved freelancer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
router.put(
  "/:id/complete",
  verifyToken,
  authorizeRoles("client"),
  completeProject
);

/**
 * @swagger
 * /api/project/{id}/progress:
 *   put:
 *     summary: Update the progress status of a project (client only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - progressStatus
 *             properties:
 *               progressStatus:
 *                 type: string
 *                 enum: [draft, ongoing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Project progress updated
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.put(
  "/:id/progress",
  verifyToken,
  authorizeRoles("client"),
  updateProjectProgress
);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Soft-delete a project (client only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.delete("/:id", verifyToken, authorizeRoles("client"), deleteProject);

module.exports = router;
