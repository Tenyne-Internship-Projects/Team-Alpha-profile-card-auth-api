const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
// const {
//   safeField,
//   safeArray,
//   calculateAge,
// } = require("../utils/sanitizeInput");

const isVerifiedProfile = require("../utils/verifiedProfile");

// Update user profile
const updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const {
    fullname,
    gender,
    age,
    dateOfBirth,
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

  const avatarFile = req.files?.avatar?.[0];
  const documentFiles = req.files?.documents || [];

  const avatarUrl = avatarFile
    ? `/uploads/badges/${avatarFile.filename}`
    : null;

  const documents = documentFiles
    ? documentFiles.map((file) => `/uploads/badges/${file.filename}`)
    : null;

  const isValidDate = (d) => d instanceof Date && !isNaN(d);
  const parsedDOB = new Date(dateOfBirth);
  const safeDOB = isValidDate(parsedDOB) ? parsedDOB : new Date();

  const safeAge = !isNaN(Number(age)) ? Number(age) : 0;
  const safeSalary = !isNaN(Number(salaryExpectation))
    ? Number(salaryExpectation)
    : undefined;

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

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullname,
        ...(hashedPassword && { password: hashedPassword }),
        profile: user.profile
          ? {
              update: {
                fullName: fullname || "",
                gender: gender || "",
                age: safeAge,
                dateOfBirth: safeDOB,
                profession: profession || "",
                specialization: specialization || "",
                location: location || "",
                bio: bio || "",
                skills: parsedSkills,
                ...(avatarUrl && { avatarUrl }),
                ...(documents && { documents }),
                linkedIn: linkedIn || "",
                github: github || "",
                primaryEmail: primaryEmail || "",
                phoneNumber: phoneNumber || "",
                ...(safeSalary !== undefined && {
                  salaryExpectation: safeSalary,
                }),
              },
            }
          : {
              create: {
                fullName: fullname || "",
                gender: gender || "",
                age: safeAge,
                dateOfBirth: safeDOB,
                profession: profession || "",
                specialization: specialization || "",
                location: location || "",
                bio: bio || "",
                skills: parsedSkills,
                avatarUrl,
                documents,
                linkedIn: linkedIn || "",
                github: github || "",
                primaryEmail: primaryEmail || "",
                phoneNumber: phoneNumber || "",
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
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

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

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { profile: true } });
    return res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get single user by ID
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

// Delete user account
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

// Toggle availability status
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

// Get user badges — only for verified users
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

// Upload badge — only for verified users
const uploadBadge = async (req, res) => {
  const { userId } = req.params;
  const badgeFile = req.file; // assuming single file upload middleware

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

    // Save badge file path and associate with profile badges
    const badgeUrl = `/uploads/badges/${badgeFile.filename}`;

    // Fetch current badges
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ message: "User or profile not found" });
    }

    // Append new badge to existing badges array or create new array
    const currentBadges = user.profile.badges || [];
    const updatedBadges = [...currentBadges, badgeUrl];

    // Update profile badges
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
};
