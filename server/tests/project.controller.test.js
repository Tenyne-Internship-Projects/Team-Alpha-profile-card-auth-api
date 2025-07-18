const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
  completeProject,
  updateProjectProgress,
} = require("../controllers/project.controller");

const sendNotification = require("../utils/sendNotification");
jest.mock("../utils/sendNotification", () => jest.fn());

const { PrismaClient } = require("@prisma/client");
jest.mock("@prisma/client", () => {
  const mockProject = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };
  const mockPayment = {
    create: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({
      user: mockUser,
      project: mockProject,
      payment: mockPayment,
    })),
  };
});

const prisma = new PrismaClient();

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("Project Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProject", () => {
    it("should return 400 if required fields are missing in active project", async () => {
      const req = { params: { clientId: "123" }, body: { isDraft: false } };
      const res = mockRes();

      await createProject(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing required fields",
      });
    });

    it("should create a draft project", async () => {
      const req = {
        params: { clientId: "123" },
        body: { isDraft: true },
        app: { get: jest.fn().mockReturnValue({}) },
      };
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue({ id: "123" });
      prisma.project.create.mockResolvedValue({
        title: "Test Project",
        id: "abc",
      });

      await createProject(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Draft saved successfully",
        data: { title: "Test Project", id: "abc" },
      });
    });
  });

  describe("getAllProjects", () => {
    it("should return list of projects and count", async () => {
      const req = {
        query: { page: "1", limit: "5" },
        user: { userId: "client1", role: "client" },
      };
      const res = mockRes();

      prisma.project.findMany.mockResolvedValue([{ id: "1" }, { id: "2" }]);
      prisma.project.count.mockResolvedValue(2);

      await getAllProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [{ id: "1" }, { id: "2" }],
        meta: {
          total: 2,
          page: 1,
          pageSize: 5,
          totalPages: 1,
        },
      });
    });
  });

  describe("getProjectById", () => {
    it("should return 404 if not found", async () => {
      const req = { params: { id: "not-found" } };
      const res = mockRes();

      prisma.project.findUnique.mockResolvedValue(null);

      await getProjectById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Project not found" });
    });

    it("should return project", async () => {
      const req = { params: { id: "project-id" } };
      const res = mockRes();
      prisma.project.findUnique.mockResolvedValue({
        id: "project-id",
        title: "Test",
      });

      await getProjectById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: "project-id", title: "Test" },
      });
    });
  });

  describe("updateProject", () => {
    it("should return 403 if unauthorized", async () => {
      const req = {
        params: { id: "project-id" },
        body: {},
        user: { userId: "not-owner" },
      };
      const res = mockRes();

      prisma.project.findUnique.mockResolvedValue({
        id: "project-id",
        clientId: "owner",
        deleted: false,
      });

      await updateProject(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });
  });

  describe("deleteProject", () => {
    it("should delete if authorized", async () => {
      const req = {
        params: { id: "project-id" },
        user: { userId: "client-id", role: "client" },
      };
      const res = mockRes();

      prisma.project.findUnique.mockResolvedValue({
        id: "project-id",
        clientId: "client-id",
        deleted: false,
      });
      prisma.project.update.mockResolvedValue({});

      await deleteProject(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Project deleted successfully",
      });
    });
  });

  describe("archiveProject", () => {
    it("should archive project", async () => {
      const req = {
        params: { id: "project-id" },
        user: { userId: "client-id", role: "client" },
      };
      const res = mockRes();

      prisma.project.findUnique.mockResolvedValue({
        id: "project-id",
        clientId: "client-id",
        deleted: false,
        status: "closed", // ✅ ensure project can be archived
      });
      prisma.project.update.mockResolvedValue({});

      await archiveProject(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Project archived",
        project: {},
      });
    });
  });

  describe("unarchiveProject", () => {
    it("should unarchive project", async () => {
      const req = {
        params: { id: "project-id" },
        user: { userId: "client-id", role: "client" },
      };
      const res = mockRes();

      prisma.project.findUnique.mockResolvedValue({
        id: "project-id",
        clientId: "client-id",
        deleted: true, // ✅ project is archived
      });
      prisma.project.update.mockResolvedValue({});

      await unarchiveProject(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Project unarchived",
        project: {},
      });
    });
  });

  describe("completeProject", () => {
    it("should complete and notify", async () => {
      const req = {
        params: { id: "project-id" },
        user: { userId: "client-id", role: "client" },
        app: { get: jest.fn().mockReturnValue({}) },
      };
      const res = mockRes();

      prisma.project.findUnique.mockResolvedValue({
        id: "project-id",
        clientId: "client-id",
        progressStatus: "ongoing",
        budget: 1000,
        title: "Awesome Project",
        applications: [{ freelancerId: "freelancer-1", status: "approved" }],
      });

      prisma.payment.create.mockResolvedValue({ id: "payment-id" });
      prisma.project.update.mockResolvedValue({
        id: "project-id",
        title: "Awesome Project",
        clientId: "client-id",
        payment: { id: "payment-id" },
      });

      await completeProject(req, res);
      expect(sendNotification).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Completed & paid",
        project: {
          id: "project-id",
          title: "Awesome Project",
          clientId: "client-id",
          payment: { id: "payment-id" },
        },
      });
    });
  });

  describe("updateProjectProgress", () => {
    it("should update progress if authorized", async () => {
      const req = {
        params: { id: "project-id" },
        body: { progressStatus: "ongoing" }, // ✅ valid progress status
        user: { userId: "freelancer-id", role: "freelancer" },
        app: { get: jest.fn().mockReturnValue({}) },
      };
      const res = mockRes();

      prisma.project.findUnique.mockResolvedValue({
        id: "project-id",
        deleted: false,
        clientId: "freelancer-id",
        applications: [{ freelancerId: "freelancer-id", status: "approved" }],
      });

      prisma.project.update.mockResolvedValue({
        id: "project-id",
        progressStatus: "ongoing",
      });

      await updateProjectProgress(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Project progress updated",
        project: { id: "project-id", progressStatus: "ongoing" },
      });
    });
  });
});
