const express = require("express");
const {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  toggleAvailability,
  getUserBadges,
  uploadBadge,
} = require("../controllers/user.controller");

const upload = require("../middlewares/uploads");
const validateRequest = require("../validators/validateRequest");
const {
  profileUpdateSchema,
  availabilityToggleSchema,
} = require("../validators/profileValidator");

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Route working");
});

// @route   GET /api/users
// @desc    Get all users
router.get("/", getAllUsers);

// @route   GET /api/users/:userId
// @desc    Get user profile by ID
router.get("/:userId", getUserProfile);

// @route   PUT /api/users/:userId
// @desc    Update user profile
router.put(
  "/:userId",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  validateRequest(profileUpdateSchema),
  updateUserProfile
);

// @route   PATCH /api/users/:userId/availability
// @desc    Toggle availability status
router.patch(
  "/:userId/availability",
  validateRequest(availabilityToggleSchema),
  toggleAvailability
);

// --- Badge routes ---

// @route   GET /api/users/:userId/badges
// @desc    Get badges of verified user
router.get("/:userId/badges", getUserBadges);

// @route   POST /api/users/:userId/badges
// @desc    Upload badge for verified user
router.post(
  "/:userId/badges",
  upload.single("badge"), // expects a single file named 'badge'
  uploadBadge
);

// @route   DELETE /api/users/:userId
// @desc    Delete user account
router.delete("/:userId", deleteUserAccount);

module.exports = router;
