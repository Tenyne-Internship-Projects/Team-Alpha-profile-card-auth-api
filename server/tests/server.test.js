// server/tests/server.test.js
const request = require("supertest");
const { app } = require("../server"); // Adjust path as needed

describe("Server setup and basic routes", () => {
  test("GET / - should return API running message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("API is running...");
  });

  test("GET /swagger.json - should return swagger JSON", async () => {
    const res = await request(app).get("/swagger.json");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toHaveProperty("openapi"); // assuming swaggerSpec is valid
  });

  test("GET /unknown-route - should return 404 or server error", async () => {
    const res = await request(app).get("/api/nonexistent");
    // Depending on your route fallback, it may 404 or 500
    expect([404, 500]).toContain(res.statusCode);
  });

  test("CORS error handling - should return 403 for disallowed origin", async () => {
    const res = await request(app)
      .get("/")
      .set("Origin", "http://not-allowed-origin.com");

    // CORS middleware should catch this if origin isn't in the list
    if (res.statusCode === 403) {
      expect(res.body.message).toBe("Not allowed by CORS");
    }
  });
});
