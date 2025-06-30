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

// Test route to verify client route file is working
router.get("/test", (req, res) => {
  res.send("Client route working ✅");
});

// Create or update client profile
router.put(
  "/client/:userId",
  verifyToken,
  authorizeRoles("client"),
  upload.single("companyLogo"),
  updateClientProfile
);

// Get client profile by ID
router.get(
  "/client/:userId",
  verifyToken,
  authorizeRoles("client", "admin"),
  getClientProfile
);

// Get all clients (admin only)
router.get("/clients", verifyToken, authorizeRoles("admin"), getAllClients);

// Delete client (admin only)
router.delete(
  "/client/:userId",
  verifyToken,
  authorizeRoles("admin"),
  deleteClient
);

module.exports = router;
