const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const sendNotification = require("../utils/sendNotification");

//  APPLY TO PROJECT
const applyToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;
    const freelancerId = req.user.userId;

    if (req.user.role !== "freelancer") {
      return res.status(403).json({ error: "Only freelancers can apply" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project || project.status !== "open" || project.deleted) {
      return res.status(400).json({ error: "This project is not available" });
    }

    const existing = await prisma.application.findUnique({
      where: {
        unique_application: {
          projectId,
          freelancerId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "You have already applied to this project" });
    }

    const application = await prisma.application.create({
      data: {
        projectId,
        freelancerId,
        message,
      },
    });

    // ✅ Notify the Client
    await sendNotification({
      userId: project.clientId,
      title: "New Application Received",
      message: `A freelancer has applied to your project "${project.title}".`,
      type: "application",
      io: req.app.get("io"),
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

//  FREELANCER VIEWS THEIR APPLICATIONS
const getMyApplications = async (req, res) => {
  try {
    const freelancerId = req.user.userId;

    if (req.user.role !== "freelancer") {
      return res.status(403).json({ error: "Only freelancers can access this" });
    }

    const applications = await prisma.application.findMany({
      where: { freelancerId },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ data: applications });
  } catch (error) {
    console.error("Get Applications Error:", error);
    return res.status(500).json({ error: "Failed to fetch applications" });
  }
};

//  CLIENT SEES ALL APPLICATIONS TO THEIR JOBS
const getAllApplicationsByClient = async (req, res) => {
  try {
    const clientId = req.user.userId;

    if (req.user.role !== "client") {
      return res.status(403).json({ error: "Only clients can access this" });
    }

    const applications = await prisma.application.findMany({
      where: {
        project: { clientId },
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
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ data: applications });
  } catch (error) {
    console.error("Error fetching applications by client:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

//  GET ALL APPLICANTS FOR A SPECIFIC PROJECT
const getProjectApplicants = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

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
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ data: applicants });
  } catch (error) {
    console.error("Fetch Applicants Error:", error);
    return res.status(500).json({ error: "Failed to fetch applicants" });
  }
};

//  CLIENT UPDATES APPLICATION STATUS (approved/rejected) + Notifies Freelancer
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const project = application.project;

    if (req.user.userId !== project.clientId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    if (status === "approved") {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          progressStatus: "ongoing",
          status: "open",
        },
      });
    }

    if (status === "rejected") {
      const hasApproved = await prisma.application.findFirst({
        where: {
          projectId: project.id,
          status: "approved",
          NOT: { id: applicationId },
        },
      });

      if (!hasApproved) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            progressStatus: "cancelled",
            status: "closed",
          },
        });
      }
    }

    //  Notify Freelancer after application status update
    await sendNotification({
      userId: application.freelancerId,
      title: `Application ${status}`,
      message: `Your application for "${project.title}" has been marked as ${status}.`,
      type: "application_status",
      io: req.app.get("io"),
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
