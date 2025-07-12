const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/mailer");
const verifyEmailHTML = require("../utils/emails/verification-email");
const resetPasswordHTML = require("../utils/emails/reset-password-email");
const generateTokens = require("../utils/generateToken");

const prisma = new PrismaClient();

// Generate 6-digit numeric token
const generateNumericToken = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// REGISTER
const registerUser = async (req, res) => {
  const { fullname, email, password, role } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const isStrongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(
    password
  );
  if (!isStrongPassword) {
    return res.status(400).json({
      message: "Password must include uppercase, lowercase, and a number",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateNumericToken();
    const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    const verificationLink = `${process.env.FRONTEND_URL_EMAIL_VERIFICATION}/${verificationToken}`;

    const newUser = await prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        role: role || "freelancer",
        verified: false,
        verificationToken,
        verificationTokenExpires,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    // Create profile based on role
    if (newUser.role === "freelancer") {
      await prisma.freelancerProfile.create({
        data: {
          userId: newUser.id,
          fullName: newUser.fullname,
          gender: "not specified",
          dateOfBirth: new Date(),
          profession: "",
          specialization: "",
          location: "",
          primaryEmail: newUser.email,
          phoneNumber: "",
          skills: [],
          documents: [],
        },
      });
    } else if (newUser.role === "client") {
      await prisma.clientProfile.create({
        data: {
          userId: newUser.id,
          companyName: "",
          companyWebsite: "",
          companyIndustry: "",
          companySize: "",
          companyAddress: "",
          companyLogo: "",
          hiringCategories: [],
        },
      });
    }

    // Log saved user
    console.log("✅ New user saved to DB:", {
      id: newUser.id,
      fullname: newUser.fullname,
      email: newUser.email,
      role: newUser.role,
      verified: newUser.verified,
    });

    // Send verification email
    await sendEmail(
      email,
      "Verify Your Email Address",
      verifyEmailHTML(verificationLink)
    );

    const { accessToken, refreshToken } = generateTokens(
      newUser.id,
      newUser.role
    );

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Respond with public data only
    return res.status(201).json({
      message: "User registered. Please verify your email.",
      accessToken,
      user: {
        id: newUser.id,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role,
        verified: newUser.verified,
      },
    });
  } catch (err) {
    console.error("[Register Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// VERIFY EMAIL
const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) return res.status(404).json({ message: "Invalid token" });
    if (user.verified)
      return res.status(400).json({ message: "Already verified" });
    if (new Date() > user.verificationTokenExpires) {
      return res.status(400).json({ message: "Verification token expired" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("[Verify Email Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// RESEND VERIFICATION EMAIL
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

    const token = generateNumericToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    const link = `${process.env.FRONTEND_URL_EMAIL_VERIFICATION}/${token}`;

    await prisma.user.update({
      where: { email },
      data: { verificationToken: token, verificationTokenExpires: expires },
    });

    await sendEmail(email, "Verify Your Email", verifyEmailHTML(link));
    return res.status(200).json({ message: "Verification email resent" });
  } catch (err) {
    console.error("[Resend Verification Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 🚨 Validate request body
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    console.log("🔍 Attempting login for:", email);

    // 🔎 Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.warn("⚠️ No user found with email:", email);
      return res
        .status(404)
        .json({ message: `No user found with email: ${email}` });
    }

    // 🔐 Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn("⚠️ Invalid password attempt for:", email);
      return res.status(401).json({ message: "Invalid password" });
    }

    // ❗ Check verification
    if (!user.verified) {
      console.warn("⚠️ Email not verified for:", email);
      return res
        .status(401)
        .json({ message: "Please verify your email before logging in." });
    }

    // ✅ Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // 🍪 Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log("✅ Login successful for:", email);

    // 📤 Return response
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ [Login Error]:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// LOGOUT
const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  return res.status(200).json({ message: "Logout successful" });
};

// REFRESH ACCESS TOKEN
const refreshAccessToken = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("[Refresh Token Error]", err);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

// REQUEST PASSWORD RESET
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res
        .status(200)
        .json({ message: "If email exists, a reset link has been sent." });

    const resetToken = generateNumericToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    const resetLink = `${process.env.FRONTEND_URL_EMAIL_RESET_PASSWORD}/${resetToken}`;

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpires },
    });

    await sendEmail(email, "Reset Your Password", resetPasswordHTML(resetLink));
    return res.status(200).json({ message: "Password reset link sent" });
  } catch (err) {
    console.error("[Request Reset Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { resetToken: token } });

    if (!user || new Date() > user.resetTokenExpires) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("[Reset Password Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  logout,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
};
