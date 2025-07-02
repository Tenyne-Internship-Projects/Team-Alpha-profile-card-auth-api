// tests/auth.test.js

process.env.JWT_SECRET = "testsecret";
process.env.JWT_REFRESH_SECRET = "refreshsecret";
process.env.FRONTEND_URL_EMAIL_VERIFICATION = "http://localhost/verify";

jest.mock("@prisma/client");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../utils/mailer", () => ({
  sendEmail: jest.fn(() => Promise.resolve()),
}));
jest.mock("../utils/generateToken", () => () => ({
  accessToken: "mockAccessToken",
  refreshToken: "mockRefreshToken",
}));

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  registerUser,
  loginUser,
  logout,
} = require("../controllers/auth.controller");

describe("Auth Controller", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const req = {
        body: {
          fullname: "John Doe",
          email: "john@example.com",
          password: "Password1",
          role: "freelancer",
        },
        files: [],
      };

      bcrypt.hash.mockResolvedValue("hashed_Password1");
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        fullname: "John Doe",
        email: "john@example.com",
        role: "freelancer",
        verified: false,
      });

      // ✅ Fix: Mock freelancerProfile manually
      prisma.freelancerProfile = {
        create: jest.fn(() => Promise.resolve({})),
      };

      await registerUser(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User registered. Please verify your email.",
        })
      );
    });

    it("should reject weak passwords", async () => {
      const req = {
        body: {
          fullname: "John",
          email: "weak@example.com",
          password: "123",
        },
        files: [],
      };

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Password must include"),
        })
      );
    });

    it("should return 400 if user already exists", async () => {
      const req = {
        body: {
          fullname: "Jane Doe",
          email: "existing@example.com",
          password: "Password1",
        },
        files: [],
      };

      prisma.user.findUnique.mockResolvedValue({
        email: "existing@example.com",
      });

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User already exists" })
      );
    });
  });

  describe("loginUser", () => {
    it("should login successfully if credentials are valid", async () => {
      const req = {
        body: {
          email: "verified@example.com",
          password: "Password1",
        },
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "verified@example.com",
        fullname: "Verified User",
        password: "hashed_password",
        role: "client",
        verified: true,
      });

      bcrypt.compare.mockResolvedValue(true);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "mockRefreshToken",
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          accessToken: "mockAccessToken",
          user: expect.objectContaining({ email: "verified@example.com" }),
        })
      );
    });

    it("should return 401 for unverified users", async () => {
      const req = {
        body: {
          email: "unverified@example.com",
          password: "Password1",
        },
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 2,
        email: "unverified@example.com",
        password: "hashed_password",
        verified: false,
      });

      bcrypt.compare.mockResolvedValue(true);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Please verify your email" })
      );
    });

    it("should return 401 for invalid password", async () => {
      const req = {
        body: {
          email: "existing@example.com",
          password: "wrongpassword",
        },
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 3,
        email: "existing@example.com",
        password: "hashed_password",
        verified: true,
      });

      bcrypt.compare.mockResolvedValue(false);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid credentials" })
      );
    });

    it("should return 401 if user not found", async () => {
      const req = {
        body: {
          email: "missing@example.com",
          password: "Password1",
        },
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid credentials" })
      );
    });
  });

  describe("logout", () => {
    it("should clear refreshToken cookie and return 200", async () => {
      const req = {};

      await logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
    });
  });
});
