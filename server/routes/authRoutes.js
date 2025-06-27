const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyEmail,
  loginUser,
  logout,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/auth.controller");

const loginLimiter = require("../middlewares/rateLimiter");
const validateRequest = require("../validators/validateRequest");

const {
  loginSchema,
  passwordResetSchema,
  requestPasswordResetSchema,
} = require("../validators/authValidator");

// =================== ✅ Test Route ===================
router.get("/test", (req, res) => res.send("Route working"));

// ================ ✅ Registration & Profile ================
router.post("/register", registerUser);

// =================  Authentication =================
router.post("/login", loginLimiter, validateRequest(loginSchema), loginUser);
router.post("/logout", logout);

// ============ ✅ Email Verification =============
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// ============ ✅ Password Reset =============
router.post(
  "/request-password-reset",
  validateRequest(requestPasswordResetSchema),
  requestPasswordReset
);

router.post(
  "/reset-password/:token",
  validateRequest(passwordResetSchema),
  resetPassword
);

module.exports = router;
