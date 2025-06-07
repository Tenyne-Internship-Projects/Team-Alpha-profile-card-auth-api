const express = require("express");

const {
  registerUser,
  verifyEmail,
  login,
  logout,
} = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const upload = require("../middlewares/uploads");
const loginLimiter = require("../middlewares/rateLimiter");
const validateRequest = require("../validators/validateRequest");
const { profileUpdateSchema } = require("../validators/profileValidator");

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Route working");
});

router.post(
  "/register",

  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  registerUser
);

router.put(
  "/users/:userId",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  validateRequest(profileUpdateSchema),
  userController.updateUserProfile
);

router.get("/verify-email", verifyEmail);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

module.exports = router;
