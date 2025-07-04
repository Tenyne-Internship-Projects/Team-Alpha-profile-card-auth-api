const express = require("express");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getAllClientProjects,
} = require("../controllers/project.controller");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management routes
 */

/**
 * @swagger
 * /api/project/create/{clientId}:
 *   post:
 *     summary: Create a new project (client only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID creating the project
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
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *             required:
 *               - title
 *               - description
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *     summary: Get all projects (authenticated users)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all projects
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, getAllProjects);
router.get(
  "my-projects/:clientId",
  verifyToken,
  authorizeRoles("client"),
  getAllClientProjects
);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *       401:
 *         description: Unauthorized
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
 *         description: Project ID to update
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
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
router.put("/:id", verifyToken, authorizeRoles("client"), updateProject);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Delete a project (client only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID to delete
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
router.delete("/:id", verifyToken, authorizeRoles("client"), deleteProject);

module.exports = router;
