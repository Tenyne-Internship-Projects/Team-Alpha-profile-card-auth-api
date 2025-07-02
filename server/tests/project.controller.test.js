const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
  getClientProjects,
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
    it("should create a new project", async () => {
      const req = mockRequest(
        { userId: "client123", role: "client" },
        {
          title: "Project Title",
          description: "Project Description",
          budget: 1000,
          tags: ["react", "node"],
          responsibilities: "Responsibilities",
          location: "Remote",
          deadline: new Date().toISOString(),
          requirement: "Must have experience",
        },
        { clientId: "client123" }
      );
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValue({ id: "client123" });
      prisma.project.create.mockResolvedValue({
        id: "project123",
        ...req.body,
      });

      await createProject(req, res);

      expect(prisma.project.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Project created successfully" })
      );
    });

    it("should return 400 for missing required fields", async () => {
      const req = mockRequest({}, { title: "Test" }, { clientId: "client123" });
      const res = mockResponse();

      await createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getProjectById", () => {
    it("should return project data if found", async () => {
      const req = mockRequest({}, {}, { id: "project123" });
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        id: "project123",
        title: "Sample",
      });

      await getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if project not found", async () => {
      const req = mockRequest({}, {}, { id: "invalidId" });
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue(null);

      await getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteProject", () => {
    it("should mark project as deleted", async () => {
      const req = mockRequest(
        { userId: "client123", role: "client" },
        {},
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        id: "project123",
        clientId: "client123",
        deleted: false,
      });
      prisma.project.update.mockResolvedValue({});

      await deleteProject(req, res);

      expect(prisma.project.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 403 if unauthorized", async () => {
      const req = mockRequest(
        { userId: "otherUser", role: "client" },
        {},
        { id: "project123" }
      );
      const res = mockResponse();

      prisma.project.findUnique.mockResolvedValue({
        id: "project123",
        clientId: "client123",
        deleted: false,
      });

      await deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
