const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//apply for project
const applyToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;
    const freelancerId = req.user.userId;

    // Must be a freelancer
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ error: "Only freelancers can apply" });
    }

    // Must be a valid, open, and not-deleted project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.status !== "open" || project.deleted) {
      return res.status(400).json({ error: "This project is not available" });
    }

    // Check if already applied
    const existing = await prisma.application.findUnique({
      where: {
        unique_application: {
          projectId,
          freelancerId,
        },
      },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: "You have already applied to this project" });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        projectId,
        freelancerId,
        message,
      },
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Apply Error:", error);
    return res.status(500).json({ error: "Failed to apply to project" });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const freelancerId = req.user.userId;

    if (req.user.role !== "freelancer") {
      return res
        .status(403)
        .json({ error: "Only freelancers can access this" });
    }

    const applications = await prisma.application.findMany({
      where: { freelancerId },
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ data: applications });
  } catch (error) {
    console.error("Get Applications Error:", error);
    return res.status(500).json({ error: "Failed to fetch applications" });
  }
};
//get all applicantions
const getAllApplicationsByClient = async (req, res) => {
  try {
    const clientId = req.user.userId;

    if (req.user.role !== "client") {
      return res.status(403).json({ error: "Only clients can access this" });
    }

    const applications = await prisma.application.findMany({
      where: {
        project: {
          clientId: clientId,
        },
      },
      include: {
        project: true,
        freelancer: {
          select: {
            id: true,
            fullname: true,
            email: true,
            freelancerProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ data: applications });
  } catch (error) {
    console.error("Error fetching applications by client:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};
const getProjectApplicants = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Authorization
    if (req.user.userId !== project.clientId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const applicants = await prisma.application.findMany({
      where: { projectId },
      include: {
        freelancer: {
          select: {
            id: true,
            fullname: true,
            email: true,
            freelancerProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ data: applicants });
  } catch (error) {
    console.error("Fetch Applicants Error:", error);
    return res.status(500).json({ error: "Failed to fetch applicants" });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (req.user.userId !== application.project.clientId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    return res.status(200).json({
      message: `Application ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    return res.status(500).json({ error: "Failed to update application" });
  }
};

module.exports = {
  applyToProject,
  getProjectApplicants,
  getMyApplications,
  updateApplicationStatus,
  getAllApplicationsByClient,
};
