const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "All users fetched successfully",
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get user by ID
const getUserProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

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

  // Only set avatarUrl if a new avatar is uploaded
  const avatarUrl = avatarFile
    ? `/uploads/badges/${avatarFile.filename}`
    : undefined;

  // Only set documents if new ones are uploaded
  const documents =
    documentFiles.length > 0
      ? documentFiles.map((file) => `/uploads/badges/${file.filename}`)
      : undefined;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash password only if provided
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user & profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullname,
        ...(hashedPassword && { password: hashedPassword }),
        profile: {
          update: {
            fullName: fullname,
            gender,
            age: age ? Number(age) : undefined,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            profession,
            specialization,
            location,
            bio,
            skills: skills ? JSON.parse(skills) : undefined,
            avatarUrl,
            documents,
            linkedIn,
            github,
            primaryEmail,
            phoneNumber,
            salaryExpectation: salaryExpectation
              ? Number(salaryExpectation)
              : undefined,
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

// Delete user account
const deleteUserAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ message: "User not found" });

    await prisma.user.delete({ where: { id: userId } });

    return res
      .status(200)
      .json({ message: "User account deleted successfully" });
  } catch (err) {
    console.error("Error deleting user account:", err);
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
  deleteUserAccount,
};
