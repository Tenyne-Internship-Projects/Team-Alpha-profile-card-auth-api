const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//create a new project
const createProject = async (req, res) => {
  try {
    const { title, description, budget, tags, deadline, clientId } = req.body;

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

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

//Get all project ---Elijah
const getAllProject = async (req, res) => {};
//Get project by Id Elijah
const getProjectById = async (req, res) => {};

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
  getAllProject,
  getProjectById,
  updateProject,
  deleteProject,
};
