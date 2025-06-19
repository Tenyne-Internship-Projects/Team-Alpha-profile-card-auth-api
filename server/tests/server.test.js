const request = require("supertest");
const app = require("../server");

describe("Simple Express App Tests", () => {
  test("GET / should return API running message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("API is running...");
  });

  test("GET /debug-sentry should trigger an error", async () => {
    const res = await request(app).get("/debug-sentry");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Sentry test error");
  });

  afterAll(async () => {
    // Gracefully close DB connection if using pg.Pool
    const { pool } = require("../config/db");
    if (pool && typeof pool.end === "function") {
      await pool.end();
    }
  });
});
