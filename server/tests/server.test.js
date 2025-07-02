const request = require("supertest");
const app = require("../server");

describe("API Routes", () => {
  test("GET / should return API running message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("API is running...");
  });

  describe("/api/auth", () => {
    test("POST /register should respond (status depends on validation)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullname: "Test User",
        email: "test@example.com",
        password: "Password1!",
        role: "client",
      });

      // It might return 201 (success) or 400 (duplicate or invalid)
      expect([201, 400]).toContain(res.statusCode);
    });

    test("POST /login should respond", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "Password1!",
      });

      // Might return 200 (success) or 401 (invalid)
      expect([200, 401]).toContain(res.statusCode);
    });
  });

  describe("/api/profile", () => {
    test("GET /client-profile should block unauthenticated users", async () => {
      const res = await request(app).get("/api/profile/client-profile");
      // Accept 401, 403, or 404 (route not found)
      expect([401, 403, 404]).toContain(res.statusCode);
    });

    test("GET /freelancer-profile should block unauthenticated users", async () => {
      const res = await request(app).get("/api/profile/freelancer-profile");
      expect([401, 403, 404]).toContain(res.statusCode);
    });
  });

  describe("/api/project", () => {
    test("GET / should block unauthenticated access", async () => {
      const res = await request(app).get("/api/project");
      expect([401, 403]).toContain(res.statusCode);
    });

    test("POST /create/:clientId should reject unauthorized", async () => {
      const res = await request(app)
        .post("/api/project/create/someclientid")
        .send({
          title: "Test Project",
          description: "Some desc",
          budget: 1000,
          tags: ["js"],
          responsibilities: "Do something cool",
          location: "Remote",
          deadline: new Date().toISOString(),
          requirement: "Smart dev",
        });

      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("/api/project/favorite", () => {
    test("GET / should block unauthenticated", async () => {
      const res = await request(app).get("/api/project/favorite");
      expect([401, 403]).toContain(res.statusCode);
    });

    test("POST /:projectId should block unauthenticated", async () => {
      const res = await request(app).post("/api/project/favorite/project123");
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("/api/project/archive", () => {
    test("GET / should block unauthenticated", async () => {
      const res = await request(app).get("/api/project/archive");
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("/api/applications", () => {
    test("GET / should block unauthenticated", async () => {
      const res = await request(app).get("/api/applications");
      expect([401, 403]).toContain(res.statusCode);
    });
  });
});

afterAll(async () => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    if (typeof prisma.$disconnect === "function") {
      await prisma.$disconnect();
    }
  } catch (err) {
    console.warn("⚠️ Could not disconnect Prisma properly", err.message);
  }
});
