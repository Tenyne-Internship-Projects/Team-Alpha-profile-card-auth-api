const express = require("express");
const { upload } = require("../middlewares/uploads");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const {
  updateClientProfile,
  getAllClients,
  getClientProfile,
  deleteClient,
} = require("../controllers/clientprofile.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Client Profiles
 *   description: Client profile management and administration
 */

/**
 * @swagger
 * /api/profile/client/test:
 *   get:
 *     summary: Test route to verify client profile routes are working
 *     tags: [Client Profiles]
 *     responses:
 *       200:
 *         description: Client route working
 */
router.get("/test", (req, res) => {
  res.send("Client route working ✅");
});

/**
 * @swagger
 * /api/profile/client/{userId}:
 *   put:
 *     summary: Create or update a client profile (with optional company logo upload)
 *     tags: [Client Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the client to update
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               companyLogo:
 *                 type: string
 *                 format: binary
 *               companyName:
 *                 type: string
 *               companyDescription:
 *                 type: string
 *             required:
 *               - companyName
 *     responses:
 *       200:
 *         description: Client profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/client/:userId",
  verifyToken,
  authorizeRoles("client"),
  upload.single("companyLogo"),
  updateClientProfile
);

/**
 * @swagger
 * /api/profile/client/{userId}:
 *   get:
 *     summary: Get client profile by user ID
 *     tags: [Client Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the client
 *     responses:
 *       200:
 *         description: Client profile data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/client/:userId",
  verifyToken,
  authorizeRoles("client", "admin"),
  getClientProfile
);

/**
 * @swagger
 * /api/profile/clients:
 *   get:
 *     summary: Get all clients (admin only)
 *     tags: [Client Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all clients
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/clients", verifyToken, authorizeRoles("admin"), getAllClients);

/**
 * @swagger
 * /api/profile/client/{userId}:
 *   delete:
 *     summary: Delete a client by user ID (admin only)
 *     tags: [Client Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the client to delete
 *     responses:
 *       200:
 *         description: Client deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/client/:userId",
  verifyToken,
  authorizeRoles("admin"),
  deleteClient
);

module.exports = router;
