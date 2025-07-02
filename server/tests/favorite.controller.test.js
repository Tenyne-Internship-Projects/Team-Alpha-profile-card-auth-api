const {
  addFavorite,
  getFavorites,
  removeFavorite,
} = require("../controllers/favorite.controller");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Prisma Client
jest.mock("@prisma/client", () => {
  const mockProject = {
    id: "project123",
    status: "open",
    deleted: false,
  };

  const mockFavorite = {
    freelancerId: "freelancer1",
    projectId: "project123",
    createdAt: new Date(),
  };

  const prisma = {
    project: {
      findUnique: jest.fn(() => Promise.resolve(mockProject)),
    },
    favorite: {
      create: jest.fn(() => Promise.resolve(mockFavorite)),
      findMany: jest.fn(() =>
        Promise.resolve([
          { ...mockFavorite, project: { ...mockProject } },
          { ...mockFavorite, project: { ...mockProject, deleted: true } },
        ])
      ),
      delete: jest.fn(() => Promise.resolve({})),
    },
  };

  return {
    PrismaClient: jest.fn(() => prisma),
  };
});

describe("Favorite Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addFavorite", () => {
    it("should add a project to favorites", async () => {
      const req = {
        user: { userId: "freelancer1" },
        params: { projectId: "project123" },
      };
      const res = mockResponse();

      await addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Project added to favorites",
        })
      );
    });

    it("should handle already favorited project (P2002)", async () => {
      const req = {
        user: { userId: "freelancer1" },
        params: { projectId: "project123" },
      };
      const res = mockResponse();

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      prisma.favorite.create.mockRejectedValue({ code: "P2002" });

      await addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "Project already favorited",
      });
    });

    it("should return 404 if project is deleted or not open", async () => {
      const req = {
        user: { userId: "freelancer1" },
        params: { projectId: "project123" },
      };
      const res = mockResponse();

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      prisma.project.findUnique.mockResolvedValueOnce({
        id: "project123",
        status: "closed", // simulate closed project
        deleted: false,
      });

      await addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Project not available to favorite",
      });
    });
  });

  describe("getFavorites", () => {
    it("should return non-deleted favorited projects", async () => {
      const req = {
        user: { userId: "freelancer1" },
      };
      const res = mockResponse();

      await getFavorites(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ projectId: "project123" }), // only valid projects
        ],
      });
    });
  });

  describe("removeFavorite", () => {
    it("should remove a favorite", async () => {
      const req = {
        user: { userId: "freelancer1" },
        params: { projectId: "project123" },
      };
      const res = mockResponse();

      await removeFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Favorite removed",
      });
    });
  });
});
