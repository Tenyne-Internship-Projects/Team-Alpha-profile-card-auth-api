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
  refreshAccessToken,
} = require("../controllers/auth.controller");

const loginLimiter = require("../middlewares/rateLimiter");

// =================== ✅ Test Route ===================
router.get("/test", (req, res) => res.send("Route working"));

// ================ ✅ Registration & Profile ================
router.post("/register", registerUser);

// =================  Authentication =================
router.post("/login", loginLimiter, loginUser);
router.post("/logout", logout);

// ============ ✅ Email Verification ============
router.get("/verify-email/:token", verifyEmail);

router.post("/resend-verification", resendVerificationEmail);

// ============ ✅ Password Reset ============
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshAccessToken);
module.exports = router;
