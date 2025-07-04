const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new project
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
    } = req.body;

    if (!title || !description || !budget || !deadline) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: "Client not found" });
    const project = await prisma.project.create({
      data: {
        title,
        description,
        budget,
        tags,
        responsibilities,
        location,
        deadline: new Date(deadline),
        requirement,
        Client: { connect: { id: clientId } },
      },
      include: {
        Client: {
          include: { clientProfile: true },
        },
      },
    });

    res
      .status(201)
      .json({ message: "Project created successfully", data: project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

// Get all projects
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
      include: {
        Client: {
          include: { clientProfile: true },
        },
      },
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

// Get projects by a specific client
const getAllClientProjects = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (req.user.userId !== clientId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to access this project" });
    }

    // Optional query params for pagination
    const {
      page = 1,
      limit = 5,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const where = {
      Client: { id: clientId },
      deleted: false,
    };

    const total = await prisma.project.count({ where });

    const projects = await prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        Client: {
          include: { clientProfile: true },
        },
      },
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

// Get single project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        Client: {
          include: { clientProfile: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json({ data: project });
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

// Update project
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description, budget, tags, deadline, status } = req.body;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project || project.deleted) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (req.user.userId !== project.clientId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this project" });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        budget,
        tags,
        deadline: deadline ? new Date(deadline) : undefined,
        status,
      },
      include: {
        Client: {
          include: { clientProfile: true },
        },
      },
    });

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (err) {
    console.error("[Update Project Error]", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project || project.deleted) {
      return res
        .status(404)
        .json({ message: "Project not found or already deleted" });
    }

    if (req.user.role !== "admin" && req.user.userId !== project.clientId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this project" });
    }

    await prisma.project.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.userId,
      },
    });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("[Delete Project Error]", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Archive project
const archiveProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.status !== "closed") {
      return res
        .status(400)
        .json({ message: "Only closed projects can be archived" });
    }

    if (req.user.userId !== project.clientId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to archive this project" });
    }

    const archived = await prisma.project.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.userId,
      },
      include: {
        Client: {
          include: { clientProfile: true },
        },
      },
    });

    res
      .status(200)
      .json({ message: "Project archived successfully", project: archived });
  } catch (err) {
    console.error("[Archive Project Error]", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get archived projects
const getClientProjects = async (req, res) => {
  try {
    console.log("🔐 Authenticated user:", req.user);

    if (req.user.role !== "client") {
      console.log("User is not a client. Role:", req.user.role);
      return res.status(403).json({ message: "Unauthorized" });
    }

    console.log("📦 Fetching projects for client ID:", req.user.userId);

    const allProjects = await prisma.project.findMany({
      where: { clientId: req.user.userId },
      orderBy: { createdAt: "desc" },
      include: {
        Client: {
          include: { clientProfile: true },
        },
      },
    });

    console.log(" Raw project results:", allProjects);

    const active = allProjects.filter((p) => !p.deleted);
    const archived = allProjects.filter((p) => p.deleted);

    console.log(` Active: ${active.length} | Archived: ${archived.length}`);

    return res.status(200).json({
      data: {
        active,
        archived,
      },
    });
  } catch (err) {
    console.error(" [getClientProjects Error]:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Unarchive project
const unarchiveProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project || !project.deleted) {
      return res
        .status(404)
        .json({ message: "Archived project not found or already active" });
    }

    if (req.user.userId !== project.clientId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to unarchive this project" });
    }

    const restored = await prisma.project.update({
      where: { id },
      data: {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      include: {
        Client: {
          include: { clientProfile: true },
        },
      },
    });

    res
      .status(200)
      .json({ message: "Project unarchived successfully", project: restored });
  } catch (err) {
    console.error("[Unarchive Project Error]", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getAllClientProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  getClientProjects,
  unarchiveProject,
};
