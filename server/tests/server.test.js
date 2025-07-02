const request = require("supertest");
const app = require("../server");

describe("API Routes", () => {
  test("GET / should return API running message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("API is running...");
  });

  describe("/api/auth", () => {
    test("POST /register should respond (status depends on implementation)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com", password: "password123" });
      expect([201, 400]).toContain(res.statusCode);
    });

    test("POST /login should respond", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });
      expect([200, 401]).toContain(res.statusCode);
    });
  });

  describe("/api/profile", () => {
    test("GET /client-profile should respond 401 if no auth", async () => {
      const res = await request(app).get("/api/profile/client-profile");
      expect([401, 403]).toContain(res.statusCode);
    });

    test("GET /freelancer-profile should respond 401 if no auth", async () => {
      const res = await request(app).get("/api/profile/freelancer-profile");
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("/api/project", () => {
    test("GET / should list projects", async () => {
      const res = await request(app).get("/api/project");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test("POST /create/:clientId should reject unauthorized", async () => {
      const res = await request(app)
        .post("/api/project/create/someclientid")
        .send({
          title: "Test Project",
          description: "Description",
          budget: 100,
          tags: ["test"],
          responsibilities: "Do something",
          location: "Remote",
          deadline: new Date().toISOString(),
          requirement: "Must be good",
        });
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("/api/project/favorite", () => {
    test("GET / should respond 401 if not authenticated", async () => {
      const res = await request(app).get("/api/project/favorite");
      expect([401, 403]).toContain(res.statusCode);
    });

    test("POST /:projectId should respond 401 if not authenticated", async () => {
      const res = await request(app).post("/api/project/favorite/project123");
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("/api/project/archive", () => {
    test("GET / should respond 401 if not authenticated", async () => {
      const res = await request(app).get("/api/project/archive");
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe("/api/applications", () => {
    test("GET / should respond 401 if not authenticated", async () => {
      const res = await request(app).get("/api/applications");
      expect([401, 403]).toContain(res.statusCode);
    });
  });
});

// Optional: Close DB connection after all tests if you have one
afterAll(async () => {
  const { pool } = require("../config/db");
  if (pool && typeof pool.end === "function") {
    await pool.end();
  }
});
