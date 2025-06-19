jest.mock("@prisma/client");
jest.mock("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
} = require("../controllers/user.controller");

const prisma = new PrismaClient();

// Mock response generator
const mockResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("User Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.user.findMany = jest.fn();
    prisma.user.findUnique = jest.fn();
    prisma.user.update = jest.fn();
    prisma.user.delete = jest.fn();
    bcrypt.hash = jest.fn((password) => Promise.resolve("hashed_" + password));
  });

  describe("getAllUsers", () => {
    it("should fetch all users successfully", async () => {
      const mockUsers = [
        { id: "1", fullname: "John", profile: {} },
        { id: "2", fullname: "Jane", profile: {} },
      ];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const req = {};
      const res = mockResponse();

      await getAllUsers(req, res);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        include: { profile: true },
        orderBy: { createdAt: "desc" },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "All users fetched successfully",
        count: mockUsers.length,
        users: mockUsers,
      });
    });

    it("should handle errors", async () => {
      const error = new Error("DB failure");
      prisma.user.findMany.mockRejectedValue(error);

      const req = {};
      const res = mockResponse();

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
        error: error.message,
      });
    });
  });

  describe("getUserProfile", () => {
    it("should return user profile if found", async () => {
      const userId = "1";
      const mockUser = { id: userId, fullname: "John", profile: {} };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const req = { params: { userId } };
      const res = mockResponse();

      await getUserProfile(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { profile: true },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User profile fetched successfully",
        user: mockUser,
      });
    });

    it("should return 404 if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const req = { params: { userId: "1" } };
      const res = mockResponse();

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should handle errors", async () => {
      const error = new Error("DB failure");
      prisma.user.findUnique.mockRejectedValue(error);

      const req = { params: { userId: "1" } };
      const res = mockResponse();

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
        error: error.message,
      });
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile successfully without password or files", async () => {
      const userId = "1";
      const reqBody = {
        fullname: "John Updated",
        age: "30",
        skills: JSON.stringify(["js", "node"]),
      };

      prisma.user.findUnique.mockResolvedValue({ id: userId, profile: {} });

      prisma.user.update.mockResolvedValue({
        id: userId,
        fullname: reqBody.fullname,
        profile: {
          fullName: reqBody.fullname,
          age: 30,
          skills: ["js", "node"],
        },
      });

      const req = {
        params: { userId },
        body: reqBody,
        files: {},
      };
      const res = mockResponse();

      await updateUserProfile(req, res);

      expect(bcrypt.hash).not.toHaveBeenCalled();

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({
            fullname: reqBody.fullname,
            profile: expect.objectContaining({
              update: expect.objectContaining({
                fullName: reqBody.fullname,
                age: 30,
                skills: ["js", "node"],
              }),
            }),
          }),
          include: { profile: true },
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User profile updated successfully",
          user: expect.any(Object),
        })
      );
    });

    it("should update user profile with password and files", async () => {
      const userId = "1";
      const reqBody = {
        fullname: "John Updated",
        password: "newpassword",
        skills: JSON.stringify(["js", "node"]),
      };

      prisma.user.findUnique.mockResolvedValue({ id: userId, profile: {} });

      prisma.user.update.mockResolvedValue({
        id: userId,
        fullname: reqBody.fullname,
        profile: {
          fullName: reqBody.fullname,
          password: "hashed_newpassword",
          avatarUrl: "/uploads/badges/avatar.jpg",
          documents: ["/uploads/badges/doc1.pdf", "/uploads/badges/doc2.pdf"],
          skills: ["js", "node"],
        },
      });

      const req = {
        params: { userId },
        body: reqBody,
        files: {
          avatar: [{ filename: "avatar.jpg" }],
          documents: [{ filename: "doc1.pdf" }, { filename: "doc2.pdf" }],
        },
      };
      const res = mockResponse();

      await updateUserProfile(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword", 10);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullname: reqBody.fullname,
            profile: expect.objectContaining({
              update: expect.objectContaining({
                fullName: reqBody.fullname,
                password: "hashed_newpassword",
                avatarUrl: "/uploads/badges/avatar.jpg",
                documents: [
                  "/uploads/badges/doc1.pdf",
                  "/uploads/badges/doc2.pdf",
                ],
                skills: ["js", "node"],
              }),
            }),
          }),
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User profile updated successfully",
          user: expect.any(Object),
        })
      );
    });

    it("should return 404 if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const req = {
        params: { userId: "1" },
        body: {},
        files: {},
      };
      const res = mockResponse();

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should handle errors", async () => {
      const error = new Error("DB failure");
      prisma.user.findUnique.mockRejectedValue(error);

      const req = {
        params: { userId: "1" },
        body: {},
        files: {},
      };
      const res = mockResponse();

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
        error: error.message,
      });
    });
  });

  describe("deleteUserAccount", () => {
    it("should delete user account successfully", async () => {
      const userId = "1";

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.user.delete.mockResolvedValue(true);

      const req = { params: { userId } };
      const res = mockResponse();

      await deleteUserAccount(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User account deleted successfully",
      });
    });

    it("should return 404 if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const req = { params: { userId: "1" } };
      const res = mockResponse();

      await deleteUserAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should handle errors", async () => {
      const error = new Error("DB failure");
      prisma.user.findUnique.mockRejectedValue(error);

      const req = { params: { userId: "1" } };
      const res = mockResponse();

      await deleteUserAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
        error: error.message,
      });
    });
  });
});
