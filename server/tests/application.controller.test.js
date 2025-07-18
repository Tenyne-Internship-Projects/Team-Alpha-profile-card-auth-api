const {
  applyToProject,
  getProjectApplicants,
  getMyApplications,
  updateApplicationStatus,
  getAllApplicationsByClient,
} = require("../controllers/application.controller");

const { PrismaClient } = require("@prisma/client");
jest.mock("@prisma/client");
const prisma = new PrismaClient();

// ✅ Mock sendNotification to prevent real execution
jest.mock("../utils/sendNotification", () => jest.fn());
const sendNotification = require("../utils/sendNotification");

// ✅ Helper for response mock
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Application Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("applyToProject", () => {
    it("should apply to a valid open project", async () => {
      const req = {
        params: { projectId: "project123" },
        body: { message: "Interested" },
        user: { userId: "freelancer1", role: "freelancer" },
        app: {
          get: jest.fn().mockReturnValue(null), // mock socket.io
        },
      };
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        id: "project123",
        title: "Awesome Project",
        status: "open",
        deleted: false,
        clientId: "client1",
      });

      prisma.application.findUnique.mockResolvedValue(null);
      prisma.application.create = jest.fn().mockResolvedValue({
        id: "app1",
        projectId: "project123",
        freelancerId: "freelancer1",
        message: "Interested",
      });

      sendNotification.mockResolvedValue(); // prevent it from throwing

      await applyToProject(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Application submitted successfully",
        })
      );
    });
  });

  describe("getMyApplications", () => {
    it("should return applications for freelancer", async () => {
      const req = { user: { userId: "freelancer1", role: "freelancer" } };
      const res = mockResponse();

      prisma.application.findMany.mockResolvedValue([{ id: "app1" }]);

      await getMyApplications(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Array) })
      );
    });
  });

  describe("getAllApplicationsByClient", () => {
    it("should return applications for client", async () => {
      const req = { user: { userId: "client1", role: "client" } };
      const res = mockResponse();

      prisma.application.findMany.mockResolvedValue([{ id: "app1" }]);

      await getAllApplicationsByClient(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Array) })
      );
    });
  });

  describe("getProjectApplicants", () => {
    it("should return applicants if authorized", async () => {
      const req = {
        params: { projectId: "project123" },
        user: { userId: "client1" },
      };
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        id: "project123",
        clientId: "client1",
      });

      prisma.application.findMany.mockResolvedValue([{ id: "app1" }]);

      await getProjectApplicants(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Array) })
      );
    });
  });

  describe("updateApplicationStatus", () => {
    it("should update application status if authorized", async () => {
      const req = {
        params: { applicationId: "app1" },
        body: { status: "approved" },
        user: { userId: "client1" },
        app: {
          get: jest.fn().mockReturnValue(null), // mock socket.io
        },
      };
      const res = mockResponse();

      prisma.application.findUnique.mockResolvedValue({
        id: "app1",
        status: "pending",
        freelancerId: "freelancer1",
        project: {
          id: "project123",
          title: "Awesome Project",
          clientId: "client1",
        },
      });

      prisma.application.update.mockResolvedValue({
        id: "app1",
        status: "approved",
      });

      prisma.project.update.mockResolvedValue({}); // mock project update

      sendNotification.mockResolvedValue(); // mock notification

      await updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Application approved" })
      );
    });
  });
});
