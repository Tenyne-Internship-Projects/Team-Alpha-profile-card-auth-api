const express = require("express");

//@ Import controller functions to handle user-related actions
const {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  toggleAvailability,
  getUserBadges,
  uploadBadge,
  updateAvatar,
  updateProfileWithFiles,
} = require("../controllers/user.controller");

//@ Import middleware for file upload and file conversion
const {
  uploads,
  convertToBase64,
  convertMultipleToBase64,
} = require("../middlewares/uploads");

//@ Middleware to save uploaded files to disk
const saveFilesToDisk = require("../middlewares/saveFilesToDisk");

//@ Middleware to validate incoming request data
const validateRequest = require("../validators/validateRequest");

//@ Schemas for profile validation
const {
  profileUpdateSchema,
  availabilityToggleSchema,
} = require("../validators/profileValidator");

//@ Create a new Express router
const router = express.Router();

//@ Simple test route to check if this route file is working
router.get("/test", (req, res) => {
  res.send("Route working");
});

//@ GET: Fetch all users
router.get("/", getAllUsers);

//@ GET: Fetch a single user's profile using userId
router.get("/:userId", getUserProfile);

//@ PUT: Update a user's profile with avatar and documents
router.put(
  "/:userId",
  uploads.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  saveFilesToDisk,
  validateRequest(profileUpdateSchema),
  updateUserProfile
);

//@ PATCH: Toggle user's availability status
router.patch(
  "/:userId/availability",
  validateRequest(availabilityToggleSchema),
  toggleAvailability
);

//@ GET: Get a user's earned badges
router.get("/:userId/badges", getUserBadges);

//@ POST: Upload a new badge for the user
router.post(
  "/:userId/badges",
  uploads.single("badge"), // Upload a single badge image
  saveFilesToDisk, // Save badge to disk
  uploadBadge // Save badge info in DB
);

//@ PUT: Update user's avatar and convert it to Base64
router.put(
  "/profile/avatar",
  uploads.single("avatar"),
  saveFilesToDisk,
  convertToBase64,
  updateAvatar
);

//@ PUT: Update full profile with optional avatar + documents
router.put(
  "/profile",
  uploads.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  saveFilesToDisk,
  convertMultipleToBase64,
  validateRequest(profileUpdateSchema),
  updateProfileWithFiles
);

//@ DELETE: Delete a user account by ID
router.delete("/:userId", deleteUserAccount);

//@ Export the router so it can be used in the main app
module.exports = router;
