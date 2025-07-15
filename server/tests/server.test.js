const request = require("supertest");
const { app } = require("../server");

describe("API Health Check", () => {
  test("GET / should return API running message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("API is running...");
  });
});

describe("Auth Routes", () => {
  test("POST /api/auth/register - success or duplicate", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullname: "Test User",
      email: "test@example.com",
      password: "Password1!",
      role: "client",
    });
    expect([201, 400]).toContain(res.statusCode);
  });

  test("POST /api/auth/login - success or invalid", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "Password1!",
    });
    expect([200, 401]).toContain(res.statusCode);
  });
});

describe("Profile Routes", () => {
  test("GET /api/profile/client-profile - unauthorized", async () => {
    const res = await request(app).get("/api/profile/client-profile");
    expect([401, 403, 404]).toContain(res.statusCode);
  });

  test("GET /api/profile/freelancer-profile - unauthorized", async () => {
    const res = await request(app).get("/api/profile/freelancer-profile");
    expect([401, 403, 404]).toContain(res.statusCode);
  });
});

describe("Project Routes", () => {
  test("GET /api/project - unauthorized", async () => {
    const res = await request(app).get("/api/project");
    expect([401, 403]).toContain(res.statusCode);
  });

  test("POST /api/project/create/:clientId - unauthorized", async () => {
    const res = await request(app)
      .post("/api/project/create/client123")
      .send({
        title: "Test Project",
        description: "A project description",
        budget: 1000,
        tags: ["node", "react"],
        responsibilities: "Some responsibilities",
        location: "Remote",
        deadline: new Date().toISOString(),
        requirement: "Some requirement",
      });
    expect([401, 403]).toContain(res.statusCode);
  });
});

describe("Favorite Routes", () => {
  test("GET /api/project/favorite - unauthorized", async () => {
    const res = await request(app).get("/api/project/favorite");
    expect([401, 403]).toContain(res.statusCode);
  });

  test("POST /api/project/favorite/:projectId - unauthorized", async () => {
    const res = await request(app).post("/api/project/favorite/project123");
    expect([401, 403]).toContain(res.statusCode);
  });
});

describe("Archive Routes", () => {
  test("GET /api/project/archive - unauthorized", async () => {
    const res = await request(app).get("/api/project/archive");
    expect([401, 403]).toContain(res.statusCode);
  });
});

describe("Application Routes", () => {
  test("GET /api/applications - unauthorized", async () => {
    const res = await request(app).get("/api/applications");
    expect([401, 403]).toContain(res.statusCode);
  });
});

describe("Swagger Docs", () => {
  test("GET /swagger.json should return spec", async () => {
    const res = await request(app).get("/swagger.json");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  test("GET /api-docs should load Swagger UI", async () => {
    const res = await request(app).get("/api-docs");
    expect([200, 302]).toContain(res.statusCode); // Could redirect
  });
});

afterAll(async () => {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  if (typeof prisma.$disconnect === "function") {
    await prisma.$disconnect();
  }
});
