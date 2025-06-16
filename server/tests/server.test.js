/**
 * server.test.js
 *
 * Works with a server file that calls `app.listen()` internally
 * and does NOT export the Express `app` object.
 */

const request = require("supertest");

// 1️⃣  Requiring ../server starts the real server (because server.js calls app.listen)
require("../server");

// 2️⃣  Build the base URL for supertest.
//     Keep the port in sync with whatever you use in server.js.
const PORT = process.env.PORT || 5000;
const baseURL = `http://localhost:${PORT}`;

describe("Simple Express App Tests", () => {
  test("GET / should return API running message", async () => {
    const res = await request(baseURL).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("API is running...");
  });

  test("GET /debug-sentry should trigger an error", async () => {
    const res = await request(baseURL).get("/debug-sentry");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message", "Sentry test error");
  });

  afterAll(async () => {
    /* Gracefully close DB connection if using pg.Pool (optional) */
    try {
      const { pool } = require("../config/db");
      if (pool && typeof pool.end === "function") {
        await pool.end();
      }
    } catch (_) {
      /* noop – config/db may not export `pool` in test env */
    }
  });
});
