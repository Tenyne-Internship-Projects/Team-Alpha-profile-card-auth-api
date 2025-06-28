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
const updateProject = async (req, res) => {};
//Delete Project Mr Kay
const deleteProject = async (req, res) => {};
module.exports = {
  createProject,
  getAllProject,
  getProjectById,
  updateProject,
  deleteProject,
};
