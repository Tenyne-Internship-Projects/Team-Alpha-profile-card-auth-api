// tests/auth.test.js

// Set JWT_SECRET for tests (fixes "secretOrPrivateKey must have a value" error)
process.env.JWT_SECRET = "testsecret";

jest.mock("@prisma/client");

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mock bcryptjs consistently
jest.mock("bcryptjs", () => ({
  hash: jest.fn((password, salt) => Promise.resolve("hashed_" + password)),
  compare: jest.fn((password, hashed) =>
    Promise.resolve(hashed === "hashed_" + password)
  ),
}));

const {
  registerUser,
  login,
  logout,
} = require("../controllers/auth.controller");

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock prisma findUnique
    prisma.user.findUnique = jest.fn(({ where: { email } }) => {
      if (email === "existing@example.com") {
        return Promise.resolve({
          id: 1,
          email: "existing@example.com",
          password: "hashed_password123",
        });
      }
      return Promise.resolve(null);
    });

    // Mock prisma create
    prisma.user.create = jest.fn((data) =>
      Promise.resolve({
        id: 2,
        email: data.data.email,
        password: data.data.password,
      })
    );

    // Mock prisma update (used in login and logout)
    prisma.user.update = jest.fn((args) =>
      Promise.resolve({
        id: 1,
        email: args.where.email || "existing@example.com",
        token: args.data.token || null,
      })
    );
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const req = {
        body: {
          email: "john@example.com",
          password: "password123",
        },
        files: [],
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      await registerUser(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "john@example.com",
            password: expect.any(String),
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User registered successfully" })
      );
    });

    it("should return 400 if user already exists", async () => {
      const req = {
        body: {
          email: "existing@example.com",
          password: "password123",
        },
        files: [],
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      await registerUser(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "existing@example.com" },
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User already exists" })
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should login successfully with correct credentials", async () => {
      const req = {
        body: {
          email: "existing@example.com",
          password: "password123",
        },
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      await login(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "existing@example.com" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Login successful" })
      );
    });

    it("should return 400 if user does not exist", async () => {
      const req = {
        body: {
          email: "nonexistent@example.com",
          password: "password123",
        },
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      await login(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "nonexistent@example.com" },
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid email or password" })
      );
    });

    it("should return 400 if password is incorrect", async () => {
      const req = {
        body: {
          email: "existing@example.com",
          password: "wrongpassword",
        },
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      // Override bcrypt.compare mock to return false here
      bcrypt.compare.mockImplementation(() => Promise.resolve(false));

      await login(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "existing@example.com" },
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid email or password" })
      );
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const req = {
        body: {
          email: "existing@example.com",
        },
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      await logout(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: "existing@example.com" },
        data: { token: null },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Logout successful" })
      );
    });
  });
});
