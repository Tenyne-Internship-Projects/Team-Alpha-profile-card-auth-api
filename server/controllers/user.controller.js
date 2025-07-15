const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { uploadsToCloudinary } = require("../config/uploadsToCloudinary");

const prisma = new PrismaClient();

// Update freelancer profile
const updateFreelancerProfile = async (req, res) => {
  const { userId } = req.params;
  if (req.user.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized: access denied." });
  }
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
      include: { freelancerProfile: true },
    });

    if (!user || user.role !== "freelancer") {
      return res.status(404).json({ message: "Freelancer not found" });
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
      freelancerProfile: user.freelancerProfile
        ? { update: profileData }
        : { create: profileData },
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userData,
      include: { freelancerProfile: true },
    });

    res.status(200).json({
      message: "Freelancer profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating freelancer profile:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// Upload avatar and documents
const uploadFreelancerFiles = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized: access denied." });
    }
    const avatarFile = req.files?.avatar?.[0] || null;
    const documentFiles = req.files?.documents || [];

    if (!avatarFile && documentFiles.length === 0) {
      return res
        .status(400)
        .json({ message: "No avatar or documents uploaded." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { freelancerProfile: true },
    });

    if (!user || user.role !== "freelancer" || !user.freelancerProfile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    let avatarUrl = null;
    let documentUrls = [];

    if (avatarFile?.buffer) {
      const avatarResult = await uploadsToCloudinary(
        avatarFile.buffer,
        "avatars"
      );
      avatarUrl = avatarResult.secure_url;
    }

    if (Array.isArray(documentFiles)) {
      const uploaded = await Promise.all(
        documentFiles.map((file) =>
          uploadsToCloudinary(file.buffer, "documents")
        )
      );
      documentUrls = uploaded.map((f) => f.secure_url);
    }

    const updated = await prisma.freelancerProfile.update({
      where: { id: user.freelancerProfile.id },
      data: {
        ...(avatarUrl && { avatarUrl }),
        ...(documentUrls.length && { documents: { push: documentUrls } }),
      },
    });

    res.status(200).json({
      message: "Avatar and documents uploaded successfully",
      profile: updated,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// Upload badge
const uploadBadge = async (req, res) => {
  const { userId } = req.params;
  if (req.user.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized: access denied." });
  }
  const badgeFile = req.file;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { freelancerProfile: true },
    });

    if (!user || !user.verified || !user.freelancerProfile) {
      return res
        .status(403)
        .json({ message: "Only verified freelancers can upload badges." });
    }

    if (!badgeFile?.buffer) {
      return res.status(400).json({ message: "No badge file uploaded." });
    }

    const badgeResult = await uploadsToCloudinary(badgeFile.buffer, "badges");
    const badgeUrl = badgeResult.secure_url;
    const updatedBadges = [...(user.freelancerProfile.badges || []), badgeUrl];

    await prisma.freelancerProfile.update({
      where: { id: user.freelancerProfile.id },
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

// Get all freelancers
const getAllFreelancers = async (req, res) => {
  try {
    const freelancers = await prisma.user.findMany({
      where: { role: "freelancer" },
      include: { freelancerProfile: true },
    });
    res.status(200).json(freelancers);
  } catch (err) {
    console.error("Error fetching freelancers:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Get freelancer by ID and track profile visits
const getFreelancerById = async (req, res) => {
  const { userId } = req.params;
  const visitorId = req.user?.userId; // populated by your auth middleware

  try {
    const freelancer = await prisma.user.findUnique({
      where: { id: userId },
      include: { freelancerProfile: true },
    });

    if (!freelancer || freelancer.role !== "freelancer") {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    // Prevent self-visits from being tracked
    if (visitorId && visitorId !== userId) {
      console.log("👁 Visitor:", visitorId, "| Profile Owner:", userId);

      const existingVisit = await prisma.profileVisit.findUnique({
        where: {
          profileId_visitorId: {
            profileId: userId,
            visitorId: visitorId,
          },
        },
      });

      if (existingVisit) {
        const updatedVisit = await prisma.profileVisit.update({
          where: {
            profileId_visitorId: {
              profileId: userId,
              visitorId: visitorId,
            },
          },
          data: {
            count: { increment: 1 },
            visitedAt: new Date(),
          },
        });
        console.log("🔁 Visit count incremented:", updatedVisit.count);
      } else {
        const newVisit = await prisma.profileVisit.create({
          data: {
            profileId: userId,
            visitorId: visitorId,
            count: 1,
            visitedAt: new Date(),
          },
        });
        console.log("🆕 New visit recorded:", newVisit);
      }
    } else {
      console.log("👤 Self-visit or unauthenticated — not tracked");
    }

    return res.status(200).json(freelancer);
  } catch (err) {
    console.error("❌ Error fetching freelancer profile:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Delete freelancer account
const deleteFreelancerAccount = async (req, res) => {
  const { userId } = req.params;
  try {
    await prisma.freelancerProfile.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res
      .status(200)
      .json({ message: "Freelancer account deleted successfully" });
  } catch (err) {
    console.error("Error deleting freelancer:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle availability
const toggleFreelancerAvailability = async (req, res) => {
  const { userId } = req.params;
  if (req.user.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized: access denied." });
  }
  const { isAvailable } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { freelancerProfile: true },
    });

    if (!user || !user.freelancerProfile) {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    const updated = await prisma.freelancerProfile.update({
      where: { id: user.freelancerProfile.id },
      data: { isAvailable: Boolean(isAvailable) },
    });

    res.status(200).json({
      message: `Availability updated to ${updated.isAvailable}`,
      profile: updated,
    });
  } catch (err) {
    console.error("Error toggling availability:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get badges
const getFreelancerBadges = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { freelancerProfile: { select: { badges: true } } },
    });

    if (!user || !user.verified || !user.freelancerProfile) {
      return res
        .status(403)
        .json({ message: "Not allowed or freelancer not found" });
    }

    res.status(200).json({ badges: user.freelancerProfile.badges });
  } catch (err) {
    console.error("Error fetching badges:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  updateFreelancerProfile,
  uploadFreelancerFiles,
  uploadBadge,
  getAllFreelancers,
  getFreelancerById,
  deleteFreelancerAccount,
  toggleFreelancerAvailability,
  getFreelancerBadges,
};
