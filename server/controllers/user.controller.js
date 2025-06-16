const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const {
  safeField,
  safeArray,
  calculateAge,
} = require("../utils/sanitizeInput");

const isVerifiedProfile = require("../utils/verifiedProfile");

const toUrl = (filename) => `/uploads/badges/${filename}`;

/**
 * POST /upload/:userId
 * Handles:
 *   • one file named “avatar”   (image)
 *   • many files named “documents”
 */

const uploadFiles = async (req, res) => {
  const userId = req.params.userId;

  const avatarFile = req.files?.avatar?.[0];
  const docFiles = req.files?.documents || [];

  const avatarUrl = avatarFile
    ? `/uploads/badges/${avatarFile.filename}`
    : null;
  const documentUrls = docFiles.map((f) => `/uploads/badges/${f.filename}`);

  try {
    // Check if the profile exists first
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return res
        .status(404)
        .json({ message: "Profile not found for this user." });
    }

    // Update profile with uploaded files
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        ...(avatarUrl && { avatarUrl }),
        ...(documentUrls.length > 0 && { documents: { push: documentUrls } }),
      },
    });

    return res.status(200).json({
      message: "Files uploaded successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      message: "An error occurred while uploading files",
    });
  }
};

//@ This controller updates the user profile including personal info, skills, social links, and optional files like avatar and documents.

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

  // ——— Parse / validate dateOfBirth ———
  const parsedDOB = new Date(dateOfBirth);
  const isValidDate = (d) => d instanceof Date && !isNaN(d);

  const calculateAge = (dob) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const safeDOB = isValidDate(parsedDOB) ? parsedDOB : null;
  const age = safeDOB ? calculateAge(safeDOB) : null;
  if (age !== null && (age < 0 || age > 120)) {
    return res.status(400).json({ message: "Invalid date of birth provided" });
  }

  // ——— Salary & skills parsing ———
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
    // ——— Ensure user exists ———
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ——— Hash password if supplied ———
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // ——— Update basic user table ———
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullname,
        ...(hashedPassword && { password: hashedPassword }),
        profile: user.profile
          ? {
              update: {
                fullName: safeField(fullname),
                gender: safeField(gender),
                dateOfBirth: safeDOB,
                profession: safeField(profession),
                specialization: safeField(specialization),
                location: safeField(location),
                bio: safeField(bio),
                skills: safeArray(parsedSkills),
                linkedIn: safeField(linkedIn),
                github: safeField(github),
                primaryEmail: safeField(primaryEmail),
                phoneNumber: safeField(phoneNumber),
                ...(safeSalary !== null && { salaryExpectation: safeSalary }),
                // avatarUrl & documents intentionally *not* touched here
              },
            }
          : {
              create: {
                fullName: safeField(fullname),
                gender: safeField(gender),
                dateOfBirth: safeDOB,
                profession: safeField(profession),
                specialization: safeField(specialization),
                location: safeField(location),
                bio: safeField(bio),
                skills: safeArray(parsedSkills),
                linkedIn: safeField(linkedIn),
                github: safeField(github),
                primaryEmail: safeField(primaryEmail),
                phoneNumber: safeField(phoneNumber),
                salaryExpectation: safeSalary,
              },
            },
      },
      include: { profile: true },
    });

    return res.status(200).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

//@ Update user avatar (base64 format)
const updateAvatar = async (req, res) => {
  try {
    const { userId } = req.user;
    const { avatarBase64 } = req.body;

    // Save avatar to DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarBase64 },
    });

    res.status(200).json({
      message: "Avatar updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ error: "Server error while updating avatar" });
  }
};

//@ Update basic profile fields with avatar and badge (base64)
const updateProfileWithFiles = async (req, res) => {
  try {
    const { userId } = req.user;

    const { fullName, bio, availability } = req.body;

    const { avatarBase64, badgeBase64 } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        bio,
        availability,
        avatar: avatarBase64 || undefined,
        badge: badgeBase64 || undefined,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile with files:", error);
    res.status(500).json({ error: "Server error updating profile" });
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
  updateAvatar,
  updateProfileWithFiles,
  uploadFiles,
};
