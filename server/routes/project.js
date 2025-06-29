const express = require("express");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
} = require("../controllers/project.controller");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

router.post("/create", verifyToken, authorizeRoles("client"), createProject);
router.get("/", verifyToken, getAllProjects);
router.get("/:id", verifyToken, getProjectById);

module.exports = router;
