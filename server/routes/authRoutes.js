const express = require("express");

const {
  registerUser,
  verifyEmail,
  login,
  refresh,
  logout,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const { uploads } = require("../middlewares/uploads");
const loginLimiter = require("../middlewares/rateLimiter");
const validateRequest = require("../validators/validateRequest");
const { profileUpdateSchema } = require("../validators/profileValidator");
const {
  registerSchema,
  loginSchema,
  passwordResetSchema,
  requestPasswordResetSchema,
} = require("../validators/authValidator");

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Route working");
});

router.post(
  "/register",
  validateRequest(registerSchema),
  uploads.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  registerUser
);

router.put(
  "/users/:userId",
  uploads.fields([
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  validateRequest(profileUpdateSchema),
  userController.updateUserProfile
);

// Authentication Routes
router.post("/login", loginLimiter, validateRequest(loginSchema), login);
router.get("/verify-email", verifyEmail);
router.post("/logout", logout);
router.post("/refresh", refresh)

// Email Verification & Password Reset Routes
router.post("/resend-verification", resendVerificationEmail);
router.post("/request-password-reset", requestPasswordReset);
router.post(
  "/request-password-reset",
  validateRequest(requestPasswordResetSchema),
  requestPasswordReset
);

module.exports = router;
