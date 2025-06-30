const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const {
  applyToProject,
  getMyApplications,
  getProjectApplicants,
  updateApplicationStatus,
  getAllApplicationsByClient,
} = require("../controllers/application.controller");
const router = express.Router();

router.post(
  "/apply/:projectId",
  verifyToken,
  authorizeRoles("freelancer"),
  applyToProject
);
//get my applications
router.get(
  "/my-applications",
  verifyToken,
  authorizeRoles("freelancer"),
  getMyApplications
);

//get project applicants
router.get(
  "/:projectId",
  verifyToken,
  authorizeRoles("client"),
  getProjectApplicants
);
router.get(
  "/",
  verifyToken,
  authorizeRoles("client"),
  getAllApplicationsByClient
);
//update application
router.put(
  "/:applicationId",
  verifyToken,
  authorizeRoles("client"),
  updateApplicationStatus
);

module.exports = router;
