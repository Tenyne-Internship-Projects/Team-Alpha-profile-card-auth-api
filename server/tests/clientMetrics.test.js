const request = require("supertest");
const express = require("express");
const {
  getAllClientProjects,
  getClientProjectStatusMetrics,
} = require("../controllers/clientDashboard.controller");
const { PrismaClient } = require("@prisma/client");
const {
  mockAuthMiddleware,
  setMockUser,
  resetMockUser,
} = require("./utils/mockAuthMiddleware");

jest.mock("@prisma/client");
const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware); // ✅ Inject mock middleware

// Route registration
app.get("/projects", getAllClientProjects);
app.get("/metrics", getClientProjectStatusMetrics);

describe("Client Project Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
    resetMockUser(); // ✅ Reset role to default (client)
  });

  describe("GET /projects", () => {
    it("should return a paginated list of client projects", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "client123" });
      prisma.project.count.mockResolvedValue(1);
      prisma.project.findMany.mockResolvedValue([
        {
          id: "proj1",
          name: "Test Project",
          Client: { clientProfile: { name: "Test Client" } },
        },
      ]);

      const res = await request(app).get("/projects");

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "client123" },
      });
    });

    it("should return 404 if client not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/projects");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Client not found");
    });

    it("should return 500 on error", async () => {
      prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/projects");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to fetch client projects");
    });
  });

  describe("GET /metrics", () => {
    it("should return metrics for client projects", async () => {
      const mockProjects = [
        {
          progressStatus: "draft",
          status: "open",
          deleted: false,
          createdAt: new Date(),
          budget: 300,
        },
        {
          progressStatus: "completed",
          status: "closed",
          deleted: true,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          budget: 1200,
        },
      ];

      prisma.project.findMany.mockResolvedValue(mockProjects);

      const res = await request(app).get("/metrics");

      expect(res.status).toBe(200);
      expect(res.body.data.counts.total).toBe(2);
      expect(res.body.data.budgetBuckets.low).toBe(1);
      expect(res.body.data.budgetBuckets.high).toBe(1);
    });

    it("should return 403 if role is not client", async () => {
      setMockUser({ userId: "client123", role: "admin" }); // 🔁 Override role

      const res = await request(app).get("/metrics");

      expect(res.status).toBe(403);
    });

    it("should handle errors gracefully", async () => {
      prisma.project.findMany.mockRejectedValue(new Error("Something broke"));

      const res = await request(app).get("/metrics");

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal server error");
    });
  });
});
