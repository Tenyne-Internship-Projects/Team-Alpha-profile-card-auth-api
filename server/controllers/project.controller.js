const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//create a new project
const createProject = async (req, res) => {
  try {
    const { title, description, budget, tags, deadline, clientId } = req.body;

    if (!title || !description || !budget || !clientId || !deadline) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        budget,
        tags,
        deadline: new Date(deadline),
        clientId,
      },
    });

    return res
      .status(201)
      .json({ message: "Project created successfully", data: project });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ error: "Failed to create project" });
  }
};

/**
 * Get all projects
 */
const getAllProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        Client: true, // Correct relation name from schema
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ data: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
};

/**
 * Get project by ID
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: id }, // it's a String, not Number
      include: {
        Client: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.status(200).json({ data: project });
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    return res.status(500).json({ error: "Failed to fetch project" });
  }
};


//Update Project Mr Kay
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description, budget, tags, deadline, status } = req.body;

  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project || project.deleted) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Checking if the user is the owner or an admin
    if (req.user.role !== "admin" && req.user.userId !== project.clientId) {
      return res.status(403).json({ message: "Unauthorized to update this project" });
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
    });

    return res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (err) {
    console.error("[Update Project Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


//Delete Project Mr Kay
const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project || project.deleted) {
      return res.status(404).json({ message: "Project not found or already deleted" });
    }

    // Only client who owns it or an admin can delete
    if (req.user.role !== "admin" && req.user.userId !== project.clientId) {
      return res.status(403).json({ message: "Unauthorized to delete this project" });
    }

    await prisma.project.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.userId,
      },
    });

    return res.status(200).json({ message: "Project deleted successfully (soft delete)" });
  } catch (err) {
    console.error("[Delete Project Error]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
