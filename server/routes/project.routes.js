const express = require("express");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getArchivedProjects,
  archiveProject,
  unarchiveProject,
} = require("../controllers/project.controller");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

//create project
router.post(
  "/create/:clientId",
  verifyToken,
  authorizeRoles("client"),
  createProject
);
//Get all projects
router.get("/", verifyToken, getAllProjects);
//Get a single project by id
router.get("/:id", verifyToken, getProjectById);
//update a project

router.put("/:id", verifyToken, authorizeRoles("client"), updateProject);
// Delete a project by id
router.delete("/:id", verifyToken, authorizeRoles("client"), deleteProject);
//archive project
router.put(
  "/archive/:id",
  verifyToken,
  authorizeRoles("client"),
  archiveProject
);
//get archive project
router.get(
  "/archive",
  verifyToken,
  authorizeRoles("client"),
  getArchivedProjects
);
//un archive project
router.put(
  "/unarchive/:id",
  verifyToken,
  authorizeRoles("client"),
  unarchiveProject
);
module.exports = router;
