const express = require("express");
const router = express.Router();
const {
  getClientProjects,
  archiveProject,
  unarchiveProject,
} = require("../controllers/project.controller");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

//archive project
router.put("/:id", verifyToken, authorizeRoles("client"), archiveProject);
// Unified active + archived view
router.get(
  "/",
  (req, res, next) => {
    console.log("📍 Route /client-projects hit");
    next();
  },
  verifyToken,
  authorizeRoles("client"),
  getClientProjects
);

//un archive project
router.put(
  "/unarchive/:id",
  verifyToken,
  authorizeRoles("client"),
  unarchiveProject
);

module.exports = router;
