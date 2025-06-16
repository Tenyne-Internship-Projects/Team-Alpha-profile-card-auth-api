/**
 * tests/auth.controller.test.js
 *
 * Covers:
 *  ├─ registerUser
 *  ├─ verifyEmail
 *  ├─ resendVerificationEmail
 *  ├─ login
 *  ├─ requestPasswordReset
 *  ├─ resetPassword
 *  ├─ logout
 *  └─ refreshAccessToken
 */

/* ─────────────────────  GLOBAL ENV  ───────────────────── */
process.env.JWT_SECRET = "testsecret";
process.env.FRONTEND_URL = "https://client.test";
process.env.NODE_ENV = "test";

/* ─────────────────────  MODULE MOCKS  ─────────────────── */
jest.mock("@prisma/client");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../utils/generateToken");
jest.mock("../utils/mailer");

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenUtils = require("../utils/generateToken");
const mailer = require("../utils/mailer");

const prisma = new PrismaClient();

/* ─────────────────────  CONTROLLER  ───────────────────── */
const {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  refreshAccessToken,
} = require("../controllers/auth.controller");

/* ─────────────────────  HELPER: mock res  ─────────────── */
const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.cookie = jest.fn(() => res);
  res.clearCookie = jest.fn(() => res);
  return res;
};

/* ─────────────────────  DEFAULT MOCKS  ────────────────── */
beforeEach(() => {
  jest.clearAllMocks();

  /* bcrypt */
  bcrypt.hash.mockImplementation((pw) => Promise.resolve("hashed_" + pw));
  bcrypt.compare.mockImplementation((pw, hashed) =>
    Promise.resolve(hashed === "hashed_" + pw)
  );

  /* token helpers */
  tokenUtils.generateAccessToken.mockReturnValue("accessToken123");
  tokenUtils.generateRefreshToken.mockResolvedValue("refreshToken123");
  tokenUtils.revokeRefreshToken.mockResolvedValue(true);

  /* JWT */
  jwt.verify.mockImplementation(() => ({ userId: 1 }));

  /* mailer */
  mailer.sendEmail.mockResolvedValue(true);

  /* prisma.user */
  prisma.user.findUnique = jest.fn();
  prisma.user.create = jest.fn();
  prisma.user.update = jest.fn();

  /* prisma.refreshToken */
  prisma.refreshToken = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
});

/* ─────────────────────  TEST SUITE  ───────────────────── */
describe("Auth Controller", () => {
  /* ────────────────  registerUser  ─────────────── */
  describe("registerUser", () => {
    it("fails on weak password", async () => {
      const req = {
        body: { fullname: "A", email: "a@test.io", password: "123" },
      };
      const res = mockRes();

      await registerUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("fails when user already exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      const req = {
        body: { fullname: "A", email: "a@test.io", password: "Password1" },
      };
      const res = mockRes();

      await registerUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("registers successfully and sends email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 2,
        fullname: "A",
        email: "a@test.io",
      });

      const req = {
        body: { fullname: "A", email: "a@test.io", password: "Password1" },
      };
      const res = mockRes();

      await registerUser(req, res);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(mailer.sendEmail).toHaveBeenCalledWith(
        "a@test.io",
        expect.stringContaining("Verify"),
        expect.stringContaining("Verify Email")
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  /* ────────────────  verifyEmail  ─────────────── */
  describe("verifyEmail", () => {
    it("requires token parameter", async () => {
      const req = { query: {} };
      const res = mockRes();

      await verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("marks unverified account as verified", async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 1, verified: false }) // fetch user
        .mockResolvedValueOnce({ id: 1, verified: true }); // after update

      const req = { query: { token: "goodtoken" } };
      const res = mockRes();

      await verifyEmail(req, res);

      expect(jwt.verify).toHaveBeenCalledWith(
        "goodtoken",
        process.env.JWT_SECRET
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { verified: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("blocks already verified users", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, verified: true });
      const req = { query: { token: "already" } };
      const res = mockRes();

      await verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handles expired token", async () => {
      jwt.verify.mockImplementation(() => {
        const err = new Error("expired");
        err.name = "TokenExpiredError";
        throw err;
      });
      const req = { query: { token: "old" } };
      const res = mockRes();

      await verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  /* ────────────────  resendVerificationEmail  ─────────── */
  describe("resendVerificationEmail", () => {
    it("requires email field", async () => {
      const req = { body: {} };
      const res = mockRes();

      await resendVerificationEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("sends email if user exists & unverified", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        verified: false,
        fullname: "A",
        email: "a@test.io",
      });
      const req = { body: { email: "a@test.io" } };
      const res = mockRes();

      await resendVerificationEmail(req, res);
      expect(mailer.sendEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("silently succeeds for verified or absent user", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, verified: true });
      const req = { body: { email: "a@test.io" } };
      const res = mockRes();

      await resendVerificationEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mailer.sendEmail).not.toHaveBeenCalled();
    });
  });

  /* ────────────────────  login  ─────────────────── */
  describe("login", () => {
    it("rejects invalid credentials", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const req = { body: { email: "bad@test.io", password: "x" } };
      const res = mockRes();

      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("rejects wrong password", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed_Password1",
        email: "e@test.io",
      });
      bcrypt.compare.mockResolvedValue(false);

      const req = { body: { email: "e@test.io", password: "wrong" } };
      const res = mockRes();

      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("logs in & sets refresh cookie", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed_Password1",
        email: "e@test.io",
      });
      const req = { body: { email: "e@test.io", password: "Password1" } };
      const res = mockRes();

      await login(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refreshToken123",
        expect.objectContaining({ httpOnly: true })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          token: "accessToken123",
        })
      );
    });
  });

  /* ────────────────  requestPasswordReset  ───────────── */
  describe("requestPasswordReset", () => {
    it("returns 404 when email not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const req = { body: { email: "x@test.io" } };
      const res = mockRes();

      await requestPasswordReset(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("sends reset email", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: "a@test.io" });
      const req = { body: { email: "a@test.io" } };
      const res = mockRes();

      await requestPasswordReset(req, res);
      expect(mailer.sendEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  /* ──────────────────  resetPassword  ────────────────── */
  describe("resetPassword", () => {
    it("rejects weak password", async () => {
      const req = { body: { token: "t", newPassword: "123" } };
      const res = mockRes();

      await resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handles invalid JWT", async () => {
      jwt.verify.mockImplementation(() => {
        const err = new Error("bad");
        err.name = "JsonWebTokenError";
        throw err;
      });
      const req = { body: { token: "bad", newPassword: "Password1" } };
      const res = mockRes();

      await resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("updates password on success", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      const req = { body: { token: "good", newPassword: "Password1" } };
      const res = mockRes();

      await resetPassword(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: "hashed_Password1" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  /* ─────────────────────  logout  ─────────────────────── */
  describe("logout", () => {
    it("needs refresh token cookie", async () => {
      const req = { cookies: {} };
      const res = mockRes();

      await logout(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("revokes token and clears cookie", async () => {
      const req = { cookies: { refreshToken: "old" } };
      const res = mockRes();

      await logout(req, res);

      expect(tokenUtils.revokeRefreshToken).toHaveBeenCalledWith("old");
      expect(res.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.objectContaining({ httpOnly: true })
      );
      expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
    });
  });

  /* ────────────────  refreshAccessToken  ─────────────── */
  describe("refreshAccessToken", () => {
    it("requires cookie", async () => {
      const req = { cookies: {} };
      const res = mockRes();

      await refreshAccessToken(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("rejects invalid/expired token", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      const req = { cookies: { refreshToken: "bad" } };
      const res = mockRes();

      await refreshAccessToken(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("refreshes and returns new tokens", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        token: "old",
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
        user: { id: 1 },
      });

      const req = { cookies: { refreshToken: "old" } };
      const res = mockRes();

      await refreshAccessToken(req, res);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { token: "old" },
        data: { revoked: true },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refreshToken123",
        expect.objectContaining({ httpOnly: true })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access token refreshed",
          token: "accessToken123",
        })
      );
    });
  });
});
