const express = require("express");
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

const { uploads, convertToBase64, convertMultipleToBase64 } = require("../middlewares/uploads");


const validateRequest = require("../validators/validateRequest");
const {
  profileUpdateSchema,
  availabilityToggleSchema,
} = require("../validators/profileValidator");

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Route working");
});

router.get("/", getAllUsers);
router.get("/:userId", getUserProfile);

router.put(
  "/:userId",
  uploads.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  validateRequest(profileUpdateSchema),
  updateUserProfile
);

router.patch(
  "/:userId/availability",
  validateRequest(availabilityToggleSchema),
  toggleAvailability
);

router.get("/:userId/badges", getUserBadges);
router.post("/:userId/badges", uploads.single("badge"), uploadBadge);

// Optional: Add schema validation if applicable
router.put(
  "/profile/avatar",
  uploads.single("avatar"),
  convertToBase64,
  updateAvatar
);

router.put(
  "/profile",
  uploads.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  convertMultipleToBase64,
  validateRequest(profileUpdateSchema),
  updateProfileWithFiles
);

router.delete("/:userId", deleteUserAccount);

module.exports = router;
