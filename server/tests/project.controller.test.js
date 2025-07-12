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

const { PrismaClient } = require("@prisma/client");
jest.mock("@prisma/client");

const prisma = new PrismaClient();

const mockRequest = (
  user = {},
  body = {},
  params = {},
  query = {},
  file = {}
) => ({
  user,
  body,
  params,
  query,
  file,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Project Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProject", () => {
    it("creates a draft project", async () => {
      const req = mockRequest(
        {},
        {
          isDraft: true,
        },
        { clientId: "client123" }
      );
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValue({ id: "client123" });
      prisma.project.create.mockResolvedValue({ id: "project123" });

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Draft saved successfully" })
      );
    });

    it("creates an active project", async () => {
      const req = mockRequest(
        {},
        {
          title: "Project",
          description: "Description",
          budget: 1000,
          deadline: new Date().toISOString(),
          isDraft: false,
        },
        { clientId: "client123" }
      );
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValue({ id: "client123" });
      prisma.project.create.mockResolvedValue({ id: "project123" });

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("returns 400 if required fields are missing", async () => {
      const req = mockRequest(
        {},
        { title: "Test", isDraft: false },
        { clientId: "client123" }
      );
      const res = mockResponse();

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllProjects", () => {
    it("returns paginated projects", async () => {
      const req = mockRequest(
        {},
        {},
        {},
        {
          page: "1",
          limit: "2",
        }
      );
      const res = mockResponse();

      prisma.project.count.mockResolvedValue(2);
      prisma.project.findMany.mockResolvedValue([{ id: "1" }, { id: "2" }]);

      await getAllProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Array) })
      );
    });
  });

  describe("getProjectById", () => {
    it("returns project if found", async () => {
      const req = mockRequest({}, {}, { id: "project123" });
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({ id: "project123" });

      await getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 if not found", async () => {
      const req = mockRequest({}, {}, { id: "missing" });
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue(null);

      await getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateProject", () => {
    it("updates project if authorized", async () => {
      const req = mockRequest(
        { userId: "client123" },
        { title: "New" },
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        id: "project123",
        clientId: "client123",
      });
      prisma.project.update.mockResolvedValue({ title: "New" });

      await updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 if unauthorized", async () => {
      const req = mockRequest({ userId: "other" }, {}, { id: "project123" });
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({ clientId: "client123" });

      await updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("deleteProject", () => {
    it("soft deletes project", async () => {
      const req = mockRequest(
        { userId: "client123", role: "client" },
        {},
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        clientId: "client123",
        deleted: false,
      });
      prisma.project.update.mockResolvedValue({});

      await deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 403 if unauthorized", async () => {
      const req = mockRequest({ userId: "other" }, {}, { id: "project123" });
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        clientId: "client123",
        deleted: false,
      });

      await deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("archiveProject", () => {
    it("archives closed project", async () => {
      const req = mockRequest(
        { userId: "client123", role: "client" },
        {},
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        status: "closed",
        clientId: "client123",
      });
      prisma.project.update.mockResolvedValue({});

      await archiveProject(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 if project not closed", async () => {
      const req = mockRequest(
        { userId: "client123" },
        {},
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        status: "open",
        clientId: "client123",
      });

      await archiveProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("unarchiveProject", () => {
    it("restores a deleted project", async () => {
      const req = mockRequest(
        { userId: "client123" },
        {},
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        deleted: true,
        clientId: "client123",
      });
      prisma.project.update.mockResolvedValue({});

      await unarchiveProject(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("completeProject", () => {
    it("marks project as completed and pays freelancer", async () => {
      const req = mockRequest(
        { userId: "client123", role: "client" },
        {},
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        id: "project123",
        clientId: "client123",
        progressStatus: "ongoing",
        budget: 500,
        applications: [{ freelancerId: "freelancer123", status: "approved" }],
      });

      prisma.payment.create.mockResolvedValue({ id: "pay123" });
      prisma.project.update.mockResolvedValue({});

      await completeProject(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 if already completed", async () => {
      const req = mockRequest(
        { userId: "client123" },
        {},
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        progressStatus: "completed",
        clientId: "client123",
        applications: [],
      });

      await completeProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateProjectProgress", () => {
    it("updates progress status", async () => {
      const req = mockRequest(
        { userId: "client123", role: "client" },
        { progressStatus: "completed" },
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        id: "project123",
        clientId: "client123",
        deleted: false,
      });

      prisma.project.update.mockResolvedValue({});

      await updateProjectProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 400 for invalid progress status", async () => {
      const req = mockRequest(
        {},
        { progressStatus: "invalid" },
        { id: "project123" }
      );
      const res = mockResponse();

      await updateProjectProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
