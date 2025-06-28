const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const { uploadsToCloudinary } = require("../utils/uploadsToCloudinary");

//@ Update user profile
const updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const nameToUse = req.body.fullname || req.body.fullName;

  const {
    gender,
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

  const safeDOB = dateOfBirth ? new Date(dateOfBirth) : null;
  const safeSalary = !isNaN(Number(salaryExpectation))
    ? Number(salaryExpectation)
    : null;

  let parsedSkills = [];
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

    const profileData = {
      ...(nameToUse && { fullName: nameToUse }),
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

    const userData = {
      ...(nameToUse && { fullname: nameToUse }),
      ...(password && { password: await bcrypt.hash(password, 10) }),
      profile: user.profile ? { update: profileData } : { create: profileData },
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userData,
      include: { profile: true },
    });

    res.status(200).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

//@ Upload avatar and documents (Cloudinary)
const uploadAvatarAndDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const avatarFile = req.files?.avatar?.[0] || null;
    const documentFiles = req.files?.documents || [];

    if (!avatarFile && documentFiles.length === 0) {
      return res
        .status(400)
        .json({ message: "No avatar or documents uploaded." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    let avatarUrl = null;
    let documentUrls = [];

    if (avatarFile && avatarFile.buffer) {
      const avatarResult = await uploadsToCloudinary(
        avatarFile.buffer,
        "avatars"
      );
      avatarUrl = avatarResult.secure_url;
    }

    if (Array.isArray(documentFiles)) {
      const uploadPromises = documentFiles.map((doc) =>
        uploadsToCloudinary(doc.buffer, "documents")
      );
      const uploadedDocs = await Promise.all(uploadPromises);
      documentUrls = uploadedDocs.map((file) => file.secure_url);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            ...(avatarUrl && { avatarUrl }),
            ...(documentUrls.length && { documents: { push: documentUrls } }),
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

//@ Upload badge (Cloudinary)
const uploadBadge = async (req, res) => {
  const { userId } = req.params;
  const badgeFile = req.file;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ message: "User or profile not found" });
    }

    if (!user.verified) {
      return res
        .status(403)
        .json({ message: "Only verified users can upload badges." });
    }

    if (!badgeFile || !badgeFile.buffer) {
      return res.status(400).json({ message: "No badge file uploaded." });
    }

    const badgeResult = await uploadsToCloudinary(badgeFile.buffer, "badges");
    const badgeUrl = badgeResult.secure_url;
    const updatedBadges = [...(user.profile.badges || []), badgeUrl];

    await prisma.profile.update({
      where: { id: user.profile.id },
      data: { badges: updatedBadges },
    });

    res.status(201).json({
      message: "Badge uploaded successfully",
      badgeUrl,
    });
  } catch (err) {
    console.error("Error uploading badge:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

//@ Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { profile: true } });
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//@ Get user profile by ID
const getUserProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//@ Delete user and profile
const deleteUserAccount = async (req, res) => {
  const { userId } = req.params;
  try {
    await prisma.profile.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (err) {
    console.error("Error deleting user account:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

//@ Toggle availability
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

    res.status(200).json({
      message: `Availability updated to ${updatedUser.profile.isAvailable}`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error toggling availability:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

//@ Get badges for verified users
const getUserBadges = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { select: { badges: true } } },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ message: "User or profile not found" });
    }

    if (!user.verified) {
      return res
        .status(403)
        .json({ message: "You must verify your email to view badges." });
    }

    res.status(200).json({ badges: user.profile.badges });
  } catch (err) {
    console.error("Error fetching badges:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
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
  uploadAvatarAndDocuments,
};
