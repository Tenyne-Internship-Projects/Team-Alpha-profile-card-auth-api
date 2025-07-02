const express = require("express");
const { upload } = require("../middlewares/uploads");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const {
  updateFreelancerProfile,
  uploadFreelancerFiles,
  getAllFreelancers,
  getFreelancerById,
  deleteFreelancerAccount,
  toggleFreelancerAvailability,
  uploadBadge,
  getFreelancerBadges,
} = require("../controllers/user.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Freelancers
 *   description: Freelancer profile and account management
 */

/**
 * @swagger
 * /api/profile/freelancer/test:
 *   get:
 *     summary: Test route to verify freelancer routes are working
 *     tags: [Freelancers]
 *     responses:
 *       200:
 *         description: Freelancer route working
 */
router.get("/test", (req, res) => {
  res.send("Freelancer route working ✅");
});

/**
 * @swagger
 * /api/profile/freelancer/{userId}:
 *   put:
 *     summary: Update freelancer profile
 *     tags: [Freelancers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Freelancer user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Freelancer profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/freelancer/:userId",
  verifyToken,
  authorizeRoles("freelancer"),
  updateFreelancerProfile
);

/**
 * @swagger
 * /api/profile/freelancer-uploads/{userId}:
 *   post:
 *     summary: Upload freelancer avatar and documents
 *     tags: [Freelancers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Freelancer user ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/freelancer-uploads/:userId",
  verifyToken,
  authorizeRoles("freelancer"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  uploadFreelancerFiles
);

/**
 * @swagger
 * /api/profile/freelancers:
 *   get:
 *     summary: Get all freelancers (admin only)
 *     tags: [Freelancers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of freelancers
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/freelancers",
  verifyToken,
  authorizeRoles("admin"),
  getAllFreelancers
);

/**
 * @swagger
 * /api/profile/freelancer/{userId}:
 *   get:
 *     summary: Get freelancer profile by user ID
 *     tags: [Freelancers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Freelancer user ID
 *     responses:
 *       200:
 *         description: Freelancer profile data
 *       401:
 *         description: Unauthorized
 */
router.get("/freelancer/:userId", verifyToken, getFreelancerById);

/**
 * @swagger
 * /api/profile/freelancer-availability/{userId}:
 *   put:
 *     summary: Toggle freelancer availability status
 *     tags: [Freelancers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Freelancer user ID
 *     responses:
 *       200:
 *         description: Availability status toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/freelancer-availability/:userId",
  verifyToken,
  authorizeRoles("freelancer"),
  toggleFreelancerAvailability
);

/**
 * @swagger
 * /api/profile/freelancer-badge/{userId}:
 *   put:
 *     summary: Upload badge image for freelancer
 *     tags: [Freelancers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Freelancer user ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               badge:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Badge uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/freelancer-badge/:userId",
  verifyToken,
  authorizeRoles("freelancer"),
  upload.single("badge"),
  uploadBadge
);

/**
 * @swagger
 * /api/profile/freelancer-badge/{userId}:
 *   get:
 *     summary: Get badges for a freelancer
 *     tags: [Freelancers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Freelancer user ID
 *     responses:
 *       200:
 *         description: List of badges
 *       401:
 *         description: Unauthorized
 */
router.get("/freelancer-badge/:userId", verifyToken, getFreelancerBadges);

/**
 * @swagger
 * /api/profile/freelancer/{userId}:
 *   delete:
 *     summary: Delete freelancer account (admin only)
 *     tags: [Freelancers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Freelancer user ID
 *     responses:
 *       200:
 *         description: Freelancer account deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/freelancer/:userId",
  verifyToken,
  authorizeRoles("admin"),
  deleteFreelancerAccount
);

module.exports = router;
