const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const sendNotification = require("../utils/sendNotification");

// Create a new project (draft or active)
const createProject = async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      title,
      description,
      budget,
      tags,
      responsibilities,
      location,
      deadline,
      requirement,
      isDraft,
    } = req.body;

    if (!isDraft && (!title || !description || !budget || !deadline)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const progressStatus = isDraft ? "draft" : "ongoing";
    const status = progressStatus === "ongoing" ? "open" : "closed";

    const project = await prisma.project.create({
      data: {
        title,
        description,
        budget,
        tags,
        responsibilities,
        location,
        deadline: deadline ? new Date(deadline) : undefined,
        requirement,
        Client: { connect: { id: clientId } },
        progressStatus,
        status,
      },
      include: { Client: { include: { clientProfile: true } } },
    });

    res.status(201).json({
      message: isDraft ? "Draft saved successfully" : "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      minBudget,
      maxBudget,
      startDate,
      endDate,
      tags,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      deleted: false,
      status: "open",
      progressStatus: "ongoing",
      AND: [],
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ],
    };

    if (minBudget || maxBudget) {
      where.AND.push({
        budget: {
          ...(minBudget && { gte: Number(minBudget) }),
          ...(maxBudget && { lte: Number(maxBudget) }),
        },
      });
    }

    if (startDate || endDate) {
      where.AND.push({
        deadline: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      });
    }

    if (tags) {
      const tagsArray = tags.split(",").map((tag) => tag.trim());
      where.AND.push({
        OR: tagsArray.map((tag) => ({ tags: { has: tag } })),
      });
    }

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
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { Client: { include: { clientProfile: true } } },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.status(200).json({ data: project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, budget, tags, deadline, status } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.deleted)
      return res.status(404).json({ message: "Project not found" });

    if (req.user.userId !== project.clientId)
      return res.status(403).json({ message: "Unauthorized" });

    const updated = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        budget,
        tags,
        deadline: deadline ? new Date(deadline) : undefined,
        status,
      },
      include: { Client: { include: { clientProfile: true } } },
    });

    res.status(200).json({ message: "Project updated", project: updated });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project || project.deleted)
      return res.status(404).json({ message: "Project not found or already deleted" });

    if (req.user.role !== "admin" && req.user.userId !== project.clientId)
      return res.status(403).json({ message: "Unauthorized" });

    await prisma.project.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.userId,
      },
    });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const archiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) return res.status(404).json({ message: "Not found" });
    if (project.status !== "closed")
      return res.status(400).json({ message: "Only closed projects can be archived" });
    if (req.user.userId !== project.clientId && req.user.role !== "admin")
      return res.status(403).json({ message: "Unauthorized" });

    const archived = await prisma.project.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.userId,
        progressStatus: "cancelled",
      },
      include: { Client: { include: { clientProfile: true } } },
    });

    res.status(200).json({ message: "Project archived", project: archived });
  } catch (error) {
    console.error("Error archiving project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const unarchiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project || !project.deleted)
      return res.status(404).json({ message: "Archived project not found" });
    if (req.user.userId !== project.clientId)
      return res.status(403).json({ message: "Unauthorized" });

    const restored = await prisma.project.update({
      where: { id },
      data: {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      include: { Client: { include: { clientProfile: true } } },
    });

    res.status(200).json({ message: "Project unarchived", project: restored });
  } catch (error) {
    console.error("Error unarchiving project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const completeProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        applications: {
          where: { status: "approved" },
        },
      },
    });

    if (!project) return res.status(404).json({ message: "Not found" });
    if (project.progressStatus === "completed")
      return res.status(400).json({ message: "Already completed" });
    if (req.user.userId !== project.clientId && req.user.role !== "admin")
      return res.status(403).json({ message: "Unauthorized" });

    const app = project.applications[0];
    if (!app) return res.status(400).json({ message: "No approved freelancer" });

    const payment = await prisma.payment.create({
      data: {
        projectId: project.id,
        freelancerId: app.freelancerId,
        amount: project.budget,
      },
    });

    const updated = await prisma.project.update({
      where: { id },
      data: {
        progressStatus: "completed",
        paymentId: payment.id,
      },
      include: {
        Client: { include: { clientProfile: true } },
        payment: true,
      },
    });

    const io = req.app.get("io");
    await sendNotification({
      userId: updated.clientId,
      title: "Project Completed",
      message: `Your project \"${updated.title}\" has been marked as completed.`,
      type: "project",
      io,
    });
    await sendNotification({
      userId: app.freelancerId,
      title: "Project Completed",
      message: `The project \"${updated.title}\" you worked on has been completed.`,
      type: "project",
      io,
    });

    res.status(200).json({ message: "Completed & paid", project: updated });
  } catch (error) {
    console.error("Error completing project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progressStatus } = req.body;
    const validStatuses = ["draft", "ongoing", "completed", "cancelled"];
    if (!validStatuses.includes(progressStatus))
      return res.status(400).json({ message: "Invalid progress status" });

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        applications: {
          where: { status: "approved" },
        },
      },
    });

    if (!project || project.deleted)
      return res.status(404).json({ message: "Project not found" });
    if (req.user.userId !== project.clientId && req.user.role !== "admin")
      return res.status(403).json({ message: "Unauthorized" });

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        progressStatus,
        status: progressStatus === "ongoing" ? "open" : "closed",
      },
      include: { Client: { include: { clientProfile: true } } },
    });

    const io = req.app.get("io");
    await sendNotification({
      userId: updatedProject.clientId,
      title: "Project Status Updated",
      message: `Project \"${updatedProject.title}\" is now marked as ${progressStatus}.`,
      type: "project_status",
      io,
    });

    if (progressStatus === "completed" && project.applications[0]) {
      await sendNotification({
        userId: project.applications[0].freelancerId,
        title: "Project Status Updated",
        message: `Project \"${updatedProject.title}\" is now marked as completed.`,
        type: "project_status",
        io,
      });
    }

    res.status(200).json({
      message: "Project progress updated",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
  completeProject,
  updateProjectProgress,
};
