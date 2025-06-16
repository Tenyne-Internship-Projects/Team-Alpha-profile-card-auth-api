const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
  revokeRefreshToken,
} = require("../utils/generateToken");
const { sendEmail } = require("../utils/mailer");

const prisma = new PrismaClient();

const registerUser = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    const isStrongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(
      password
    );
    if (!isStrongPassword) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        verified: false,
      },
    });

    const verificationToken = generateAccessToken(newUser.id, {
      expiresIn: "1d",
    });
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const message = `
      <h1>Email Verification</h1>
      <p>Hello ${newUser.fullname},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `;

    //sending email to verify account

    await sendEmail(newUser.email, "Verify your email", message);

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
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res
        .status(400)
        .json({ message: "Verification token is required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.verified)
      return res.status(400).json({ message: "User already verified" });

    await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("[Verify Email Error]", err);
    if (err.name === "TokenExpiredError")
      return res.status(400).json({ message: "Verification token expired" });
    if (err.name === "JsonWebTokenError")
      return res.status(400).json({ message: "Invalid verification token" });
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.verified) {
      return res.status(200).json({
        message:
          "If your email is registered, a verification link has been sent.",
      });
    }

    const token = generateAccessToken(user.id, { expiresIn: "1d" });
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({
      message: "Login successful",
      token: accessToken,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("[Login Error]", err);
    res.status(500).json({ message: "Server error" });
  }
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = generateAccessToken(user.id, { expiresIn: "1h" });
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

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token and new password are required" });
  }

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
    const userId = decoded.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("[Reset Password Error]", err);
    if (err.name === "TokenExpiredError")
      return res.status(400).json({ message: "Reset token expired" });
    if (err.name === "JsonWebTokenError")
      return res.status(400).json({ message: "Invalid reset token" });
    return res.status(500).json({ message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return res.status(400).json({ message: "No refresh token provided" });

    await revokeRefreshToken(token);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("[Logout Error]", err);
    res.status(500).json({ message: "Server error" });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return res.status(401).json({ message: "No refresh token provided" });

    const entry = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!entry || entry.revoked || entry.expiresAt < new Date())
      return res.status(403).json({ message: "Invalid or expired token" });

    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });

    const newRefreshToken = await generateRefreshToken(entry.user.id);
    const accessToken = generateAccessToken(entry.user.id);
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: "Access token refreshed", token: accessToken });
  } catch (err) {
    console.error("[Refresh AccessToken Error]", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  refreshAccessToken,
};
