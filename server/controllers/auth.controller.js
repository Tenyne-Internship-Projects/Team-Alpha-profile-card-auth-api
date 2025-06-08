const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");
const { sendEmail } = require("../utils/mailer");

const prisma = new PrismaClient();

// Register User
const registerUser = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    const isStrongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(
      newPassword
    );
    if (!isStrongPassword) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with verified default false (make sure Prisma schema has this)
    const newUser = await prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        verified: false,
      },
    });

    // Generate email verification token with expiry (e.g., 1 day)
    const verificationToken = generateToken(newUser.id, { expiresIn: "1d" });

    // Prepare verification URL (adjust your frontend/base URL accordingly)
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    const message = `
      <h1>Email Verification</h1>
      <p>Hello ${newUser.fullname},</p>
      <p>Thank you for registering! Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `;

    await sendEmail(newUser.email, "Verify your email", message);

    // Respond without login token - must verify first
    return res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: {
        id: newUser.id,
        email: newUser.email,
        fullname: newUser.fullname,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Verify Email Controller
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    // Decode and verify token
    const decoded = require("jsonwebtoken").verify(
      token,
      process.env.JWT_SECRET
    );

    const userId = decoded.id;

    // Find user
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Update user verified to true
    await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("[Verify Email Error]", err);
    // Handle token expiration or invalid token errors
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Verification token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid verification token" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Resend Verification Email
const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.verified) {
      // Always return 200 even if user not found or already verified
      return res.status(200).json({
        message:
          "If your email is registered, a verification link has been sent.",
      });
    }

    if (user.verified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const token = generateToken(user.id, { expiresIn: "1d" });
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const message = `
      <h1>Resend Email Verification</h1>
      <p>Hello ${user.fullname},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `;

    await sendEmail(user.email, "Verify your email", message);

    return res.status(200).json({ message: "Verification email resent" });
  } catch (err) {
    console.error("[Resend Verification Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Invalid email or password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // User is not verified
    if (!user.verified) {
      return res
        .status(403)
        .json({ message: "Please verify your email to login" });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("[Login Error]", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Step 1 - Send Reset Link
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateToken(user.id, { expiresIn: "1h" });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const message = `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `;

    await sendEmail(email, "Reset your password", message);

    return res.status(200).json({ message: "Password reset link sent" });
  } catch (err) {
    console.error("[Request Reset Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Step 2 - Reset Password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const isStrongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(
    newPassword
  );
  if (!isStrongPassword) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, and a number",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("[Reset Password Error]", err);
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Reset token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid reset token" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Logout
const logout = async (req, res) => {
  const { email } = req.body;

  await prisma.user.update({
    where: { email },
    data: { token: null },
  });

  return res.status(200).json({ message: "Logout successful" });
};

module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
};
