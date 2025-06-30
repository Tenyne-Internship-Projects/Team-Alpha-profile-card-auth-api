const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { uploadsToCloudinary } = require("../config/uploadsToCloudinary");
// @desc Create or update client profile
const updateClientProfile = async (req, res) => {
  const { userId } = req.params;
  if (req.user.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized: access denied." });
  }
  const {
    companyName,
    companyWebsite,
    companyIndustry,
    companySize,
    companyAddress,
    hiringCategories,
  } = req.body;

  let parsedCategories = [];
  try {
    parsedCategories = Array.isArray(hiringCategories)
      ? hiringCategories
      : JSON.parse(hiringCategories || "[]");
  } catch {
    parsedCategories = [];
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== "client") {
      return res.status(404).json({ message: "Client user not found" });
    }

    // Upload logo if present
    let companyLogo = null;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadsToCloudinary(
        req.file.buffer,
        "client_logos"
      );
      companyLogo = uploadResult.secure_url;
    }

    const dataToUpdate = {
      companyName,
      companyWebsite,
      companyIndustry,
      companySize,
      companyAddress,
      hiringCategories: parsedCategories,
      ...(companyLogo && { companyLogo }),
    };

    const clientProfile = await prisma.clientProfile.upsert({
      where: { userId },
      update: dataToUpdate,
      create: {
        userId,
        ...dataToUpdate,
      },
    });

    return res.status(200).json({
      message: "Client profile saved successfully",
      profile: clientProfile,
    });
  } catch (err) {
    console.error("Client profile error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// @desc Get client profile by user ID
const getClientProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error("Get client profile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Get all clients with profile
const getAllClients = async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: "client" },
      include: { clientProfile: true },
    });

    return res.status(200).json(clients);
  } catch (err) {
    console.error("Error fetching clients:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Delete client and profile
const deleteClient = async (req, res) => {
  const { userId } = req.params;

  try {
    await prisma.clientProfile.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return res.status(200).json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("Delete client error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  updateClientProfile,
  getClientProfile,
  getAllClients,
  deleteClient,
};
