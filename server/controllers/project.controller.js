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
const updateProject = async (req, res) => {};
//Delete Project Mr Kay
const deleteProject = async (req, res) => {};
module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
