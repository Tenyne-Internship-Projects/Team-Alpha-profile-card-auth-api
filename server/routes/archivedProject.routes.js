const express = require("express");
const router = express.Router();
const {
  getClientProjects,
  archiveProject,
  unarchiveProject,
} = require("../controllers/project.controller");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

/**
 * @swagger
 * tags:
 *   name: Archived Projects
 *   description: Manage archiving and viewing of client projects
 */

/**
 * @swagger
 * /api/project/archive/{id}:
 *   put:
 *     summary: Archive a project
 *     tags: [Archived Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID to archive
 *     responses:
 *       200:
 *         description: Project archived successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put("/:id", verifyToken, authorizeRoles("client"), archiveProject);

/**
 * @swagger
 * /api/project/archive:
 *   get:
 *     summary: Get all active and archived projects for a client
 *     tags: [Archived Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  (req, res, next) => {
    console.log("📍 Route /client-projects hit");
    next();
  },
  verifyToken,
  authorizeRoles("client"),
  getClientProjects
);

/**
 * @swagger
 * /api/project/archive/unarchive/{id}:
 *   put:
 *     summary: Unarchive a project
 *     tags: [Archived Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID to unarchive
 *     responses:
 *       200:
 *         description: Project unarchived successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/unarchive/:id",
  verifyToken,
  authorizeRoles("client"),
  unarchiveProject
);

module.exports = router;
