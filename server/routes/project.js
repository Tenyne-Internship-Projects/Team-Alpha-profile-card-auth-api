const express = require("express");
const router = express.Router();
const { createProject } = require("../controllers/project.controller");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

router.post("/create", verifyToken, authorizeRoles("client"), createProject);

module.exports = router;
