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

// Test route
router.get("/test", (req, res) => {
  res.send("Freelancer route working ✅");
});

// Update freelancer profile
router.put(
  "/freelancer/:userId",
  verifyToken,
  authorizeRoles("freelancer"),
  updateFreelancerProfile
);

// Upload avatar and documents
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

// Get all freelancers (admin only)
router.get(
  "/freelancers",
  verifyToken,
  authorizeRoles("admin"),
  getAllFreelancers
);

// Get freelancer profile
router.get("/freelancer/:userId", verifyToken, getFreelancerById);

// Toggle freelancer availability
router.put(
  "/freelancer-availability/:userId",
  verifyToken,
  authorizeRoles("freelancer"),
  toggleFreelancerAvailability
);

// Upload badge (freelancer only)
router.put(
  "/freelancer-badge/:userId",
  verifyToken,
  authorizeRoles("freelancer"),
  upload.single("badge"),
  uploadBadge
);

// Get badges for a freelancer
router.get("/freelancer-badge/:userId", verifyToken, getFreelancerBadges);

// Delete freelancer account (admin only)
router.delete(
  "/freelancer/:userId",
  verifyToken,
  authorizeRoles("admin"),
  deleteFreelancerAccount
);

module.exports = router;
