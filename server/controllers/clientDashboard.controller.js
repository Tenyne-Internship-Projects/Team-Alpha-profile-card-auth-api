const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all projects for a logged-in client
const getAllClientProjects = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const {
      page = 1,
      limit = 5,
      sortBy = "createdAt",
      sortOrder = "desc",
      progressStatus,
      status,
      includeArchived = "false",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const where = {
      clientId,
      ...(includeArchived === "true" ? {} : { deleted: false }),
      ...(progressStatus ? { progressStatus } : {}),
      ...(status ? { status } : {}),
    };

    const total = await prisma.project.count({ where });

    const projects = await prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: { Client: { include: { clientProfile: true } } },
    });

    res.status(200).json({
      data: projects,
      meta: {
        total,
        page: Number(page),
        pageSize: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("Error fetching client projects:", error);
    res.status(500).json({ error: "Failed to fetch client projects" });
  }
};

const getClientProjectStatusMetrics = async (req, res) => {
  try {
    const clientId = req.user.userId;

    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const allProjects = await prisma.project.findMany({
      where: { clientId },
    });

    // Categorize by progress status
    const draft = allProjects.filter(
      (p) => p.progressStatus === "draft"
    ).length;
    const ongoing = allProjects.filter(
      (p) => p.progressStatus === "ongoing"
    ).length;
    const completed = allProjects.filter(
      (p) => p.progressStatus === "completed"
    ).length;
    const cancelled = allProjects.filter(
      (p) => p.progressStatus === "cancelled"
    ).length;
    // Categorize by status
    const open = allProjects.filter((p) => p.status === "open").length;
    const closed = allProjects.filter((p) => p.status === "closed").length;

    // Active vs archived
    const archived = allProjects.filter((p) => p.deleted).length;
    const active = allProjects.filter((p) => !p.deleted).length;

    // Time-based metrics
    const now = new Date();
    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    const createdLast7Days = allProjects.filter(
      (p) => new Date(p.createdAt) >= last7Days
    ).length;

    const createdLast30Days = allProjects.filter(
      (p) => new Date(p.createdAt) >= last30Days
    ).length;

    // Budget buckets
    const lowBudget = allProjects.filter((p) => p.budget < 500).length;
    const midBudget = allProjects.filter(
      (p) => p.budget >= 500 && p.budget < 1000
    ).length;
    const highBudget = allProjects.filter((p) => p.budget >= 1000).length;

    // Total project count (explicit)
    const total = allProjects.length;

    res.status(200).json({
      data: {
        counts: {
          total,
          draft,
          ongoing,
          completed,
          cancelled,
          open,
          closed,
          active,
          archived,
        },
        created: {
          last7Days: createdLast7Days,
          last30Days: createdLast30Days,
        },
        budgetBuckets: {
          low: lowBudget,
          mid: midBudget,
          high: highBudget,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getClientProjectStatusMetrics,
  getAllClientProjects,
};
