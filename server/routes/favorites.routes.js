const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const {
  addFavorite,
  getFavorites,
  removeFavorite,
} = require("../controllers/favorite.controller");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Manage favorite projects for freelancers
 */

/**
 * @swagger
 * /api/project/favorite/{projectId}:
 *   post:
 *     summary: Add a project to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project to add to favorites
 *     responses:
 *       200:
 *         description: Project added to favorites
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/:projectId",
  verifyToken,
  authorizeRoles("freelancer"),
  addFavorite
);

/**
 * @swagger
 * /api/project/favorite:
 *   get:
 *     summary: Get all favorite projects for the logged-in freelancer
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite projects
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, authorizeRoles("freelancer"), getFavorites);

/**
 * @swagger
 * /api/project/favorite/{projectId}:
 *   delete:
 *     summary: Remove a project from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the project to remove from favorites
 *     responses:
 *       200:
 *         description: Project removed from favorites
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/:projectId",
  verifyToken,
  authorizeRoles("freelancer"),
  removeFavorite
);

module.exports = router;
