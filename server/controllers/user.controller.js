const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const {
  safeField,
  safeArray,
  calculateAge,
} = require("../utils/sanitizeInput");

const isVerifiedProfile = require("../utils/verifiedProfile");

const updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const {
    fullname,
    gender,
    dateOfBirth = null,
    profession,
    specialization,
    location,
    bio,
    skills,
    linkedIn,
    github,
    primaryEmail,
    phoneNumber,
    salaryExpectation,
    password,
  } = req.body;

  // Parse and validate DOB
  const parsedDOB = new Date(dateOfBirth);
  const isValidDate = (d) => d instanceof Date && !isNaN(d);
  const safeDOB = isValidDate(parsedDOB) ? parsedDOB : null;
  
  // Parse salary and skills
  const safeSalary = !isNaN(Number(salaryExpectation))
    ? Number(salaryExpectation)
    : null;

  let parsedSkills;
  try {
    parsedSkills = Array.isArray(skills) ? skills : JSON.parse(skills);
  } catch {
    parsedSkills = [];
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profile && !fullname) {
      return res.status(400).json({
        message: "Full name is required to create a new profile.",
      });
    }

    // Build safe profileData object (only include fields if defined/non-empty)
    const profileData = {
      ...(fullname && { fullName: fullname }),
      ...(gender && { gender }),
      ...(safeDOB && { dateOfBirth: safeDOB }),
      ...(profession && { profession }),
      ...(specialization && { specialization }),
      ...(location && { location }),
      ...(bio && { bio }),
      ...(parsedSkills.length && { skills: parsedSkills }),
      ...(linkedIn && { linkedIn }),
      ...(github && { github }),
      ...(primaryEmail && { primaryEmail }),
      ...(phoneNumber && { phoneNumber }),
      ...(safeSalary !== null && { salaryExpectation: safeSalary }),
    };

    // Optional hashed password
    const userData = {
      ...(fullname && { fullname }),
      ...(password && { password: await bcrypt.hash(password, 10) }),
      profile: user.profile ? { update: profileData } : { create: profileData },
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userData,
      include: { profile: true },
    });

    return res.status(200).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

//@ Upload avatar and documents for a user
const uploadAvatarAndDocuments = async (req, res) => {
  try {
    const { userId } = req.params;

    //@ Extract files
    const avatarFile = req.files?.avatar?.[0] || null;
    const documentFiles = req.files?.documents || [];

    //@ Validate file presence
    if (!avatarFile && documentFiles.length === 0) {
      return res
        .status(400)
        .json({ message: "No avatar or documents uploaded." });
    }

    //@ Build file URLs
    const avatarUrl = avatarFile
      ? `/uploads/badges/${avatarFile.filename}`
      : null;

    const documents = Array.isArray(documentFiles)
      ? documentFiles
          .filter((file) => file?.filename)
          .map((file) => `/uploads/badges/${file.filename}`)
      : [];

    //@ Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //@ Update profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            ...(avatarUrl && { avatarUrl }),
            ...(documents.length && { documents: { push: documents } }),
          },
        },
      },
      include: { profile: true },
    });

    res.status(200).json({
      message: "Avatar and documents uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ message: "Server error while uploading avatar/documents" });
  }
};

//@ Get all users with their profiles
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { profile: true } });
    return res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//@ Get a specific user by ID, including profile
const getUserProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//@ Delete user and their associated profile
const deleteUserAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    await prisma.profile.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({ where: { id: userId } });
    return res
      .status(200)
      .json({ message: "User account deleted successfully" });
  } catch (err) {
    console.error("Error deleting user account:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//@ Toggle user's availability status
const toggleAvailability = async (req, res) => {
  const { userId } = req.params;
  const { isAvailable } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ message: "User or profile not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            isAvailable: Boolean(isAvailable),
          },
        },
      },
      include: { profile: true },
    });

    return res.status(200).json({
      message: `Availability updated to ${updatedUser.profile.isAvailable}`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error toggling availability:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

//@ Get all badges uploaded by the user - only if user is verified
const getUserBadges = async (req, res) => {
  const { userId } = req.params;

  try {
    const isVerified = await isVerifiedProfile(userId);
    if (!isVerified) {
      return res.status(403).json({
        message: "You must verify your email to view badges.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { select: { badges: true } } },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ message: "User or profile not found" });
    }

    return res.status(200).json({ badges: user.profile.badges });
  } catch (err) {
    console.error("Error fetching badges:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

//@ Upload a new badge (image) to user's profile - only for verified users
const uploadBadge = async (req, res) => {
  const { userId } = req.params;
  const badgeFile = req.file;

  try {
    const isVerified = await isVerifiedProfile(userId);
    if (!isVerified) {
      return res.status(403).json({
        message: "Only verified users can upload badges.",
      });
    }

    if (!badgeFile) {
      return res.status(400).json({ message: "No badge file uploaded." });
    }

    //@ Generate URL path for badge and update user's profile
    const badgeUrl = `/uploads/badges/${badgeFile.filename}`;

    //@ Fetch current badges
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ message: "User or profile not found" });
    }

    //@ Append new badge to existing badges array or create new array
    const currentBadges = user.profile.badges || [];
    const updatedBadges = [...currentBadges, badgeUrl];

    //@ Update profile badges
    await prisma.profile.update({
      where: { id: user.profile.id },
      data: { badges: updatedBadges },
    });

    return res.status(201).json({
      message: "Badge uploaded successfully",
      badgeUrl,
    });
  } catch (err) {
    console.error("Error uploading badge:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

//@ Export all functions for use in routes
module.exports = {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  toggleAvailability,
  deleteUserAccount,
  getUserBadges,
  uploadBadge,
  uploadAvatarAndDocuments,
};
