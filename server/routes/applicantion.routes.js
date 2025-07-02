const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const {
  applyToProject,
  getMyApplications,
  getProjectApplicants,
  updateApplicationStatus,
  getAllApplicationsByClient,
} = require("../controllers/application.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Routes related to project applications
 */

/**
 * @swagger
 * /api/applications/apply/{projectId}:
 *   post:
 *     summary: Apply to a project
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to apply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *                 example: I am excited to work on this project.
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/apply/:projectId",
  verifyToken,
  authorizeRoles("freelancer"),
  applyToProject
);

/**
 * @swagger
 * /api/applications/my-applications:
 *   get:
 *     summary: Get all applications submitted by the logged-in freelancer
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's applications
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/my-applications",
  verifyToken,
  authorizeRoles("freelancer"),
  getMyApplications
);

/**
 * @swagger
 * /api/applications/{projectId}:
 *   get:
 *     summary: Get all applicants for a specific project (Client only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: List of applicants for the project
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/:projectId",
  verifyToken,
  authorizeRoles("client"),
  getProjectApplicants
);

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications submitted to all projects of the client
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all applications for client's projects
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  verifyToken,
  authorizeRoles("client"),
  getAllApplicationsByClient
);

/**
 * @swagger
 * /api/applications/{applicationId}:
 *   put:
 *     summary: Update the status of a specific application (Client only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the application to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Application status updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/:applicationId",
  verifyToken,
  authorizeRoles("client"),
  updateApplicationStatus
);

module.exports = router;
