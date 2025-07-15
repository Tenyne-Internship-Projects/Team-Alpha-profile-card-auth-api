// FULL FLEDGED TEST FILE FOR FREELANCER CONTROLLER

jest.mock("@prisma/client");
jest.mock("bcryptjs");
jest.mock("../config/uploadsToCloudinary", () => ({
  uploadsToCloudinary: jest
    .fn()
    .mockResolvedValue({ secure_url: "http://cloud/mock.jpg" }),
}));

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const {
  updateFreelancerProfile,
  uploadFreelancerFiles,
  uploadBadge,
  getAllFreelancers,
  getFreelancerById,
  deleteFreelancerAccount,
  toggleFreelancerAvailability,
  getFreelancerBadges,
} = require("../controllers/user.controller");

const { uploadsToCloudinary } = require("../config/uploadsToCloudinary");

const prisma = new PrismaClient();

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Freelancer Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.user = {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    };

    prisma.freelancerProfile = {
      update: jest.fn(),
      deleteMany: jest.fn(),
    };

    prisma.profileVisit = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    bcrypt.hash = jest.fn((password) => Promise.resolve("hashed_" + password));
  });

  describe("updateFreelancerProfile", () => {
    it("should update freelancer profile successfully", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "1",
        role: "freelancer",
        freelancerProfile: null,
      });

      prisma.user.update.mockResolvedValue({
        id: "1",
        fullname: "John Updated",
        freelancerProfile: {},
      });

      const req = {
        user: { userId: "1" },
        params: { userId: "1" },
        body: {
          fullname: "John Updated",
          skills: JSON.stringify(["Node.js"]),
        },
      };

      const res = mockResponse();

      await updateFreelancerProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Freelancer profile updated successfully",
        user: expect.any(Object),
      });
    });
  });

  describe("uploadFreelancerFiles", () => {
    it("should upload avatar and documents", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "1",
        role: "freelancer",
        freelancerProfile: { id: "fp1" },
      });

      prisma.freelancerProfile.update.mockResolvedValue({
        avatarUrl: "http://cloud/mock.jpg",
        documents: ["http://cloud/mock.jpg"],
      });

      const req = {
        user: { userId: "1" },
        params: { userId: "1" },
        files: {
          avatar: [{ buffer: Buffer.from("image") }],
          documents: [{ buffer: Buffer.from("doc1") }],
        },
      };

      const res = mockResponse();

      await uploadFreelancerFiles(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Avatar and documents uploaded successfully",
        profile: expect.any(Object),
      });
    });
  });

  describe("uploadBadge", () => {
    it("should upload badge successfully", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "1",
        verified: true,
        freelancerProfile: { id: "fp1", badges: [] },
      });

      prisma.freelancerProfile.update.mockResolvedValue({
        badges: ["http://cloud/mock.jpg"],
      });

      const req = {
        user: { userId: "1" },
        params: { userId: "1" },
        file: { buffer: Buffer.from("badge") },
      };

      const res = mockResponse();

      await uploadBadge(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Badge uploaded successfully",
        badgeUrl: "http://cloud/mock.jpg",
      });
    });
  });

  describe("getAllFreelancers", () => {
    it("should return all freelancers", async () => {
      prisma.user.findMany.mockResolvedValue([{ id: "1" }, { id: "2" }]);

      const req = {};
      const res = mockResponse();

      await getAllFreelancers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe("getFreelancerById", () => {
    it("should return a freelancer if found", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "1",
        role: "freelancer",
        freelancerProfile: {},
      });

      const req = { params: { userId: "1" }, user: { userId: "2" } };
      const res = mockResponse();

      await getFreelancerById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("deleteFreelancerAccount", () => {
    it("should delete freelancer account", async () => {
      prisma.freelancerProfile.deleteMany.mockResolvedValue({});
      prisma.user.delete.mockResolvedValue({});

      const req = { params: { userId: "1" } };
      const res = mockResponse();

      await deleteFreelancerAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Freelancer account deleted successfully",
      });
    });
  });

  describe("toggleFreelancerAvailability", () => {
    it("should toggle availability", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "1",
        freelancerProfile: { id: "fp1" },
      });

      prisma.freelancerProfile.update.mockResolvedValue({ isAvailable: true });

      const req = {
        user: { userId: "1" },
        params: { userId: "1" },
        body: { isAvailable: true },
      };

      const res = mockResponse();

      await toggleFreelancerAvailability(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Availability updated to true`,
        profile: expect.any(Object),
      });
    });
  });

  describe("getFreelancerBadges", () => {
    it("should return freelancer badges", async () => {
      prisma.user.findUnique.mockResolvedValue({
        verified: true,
        freelancerProfile: { badges: ["badge1"] },
      });

      const req = { params: { userId: "1" } };
      const res = mockResponse();

      await getFreelancerBadges(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ badges: ["badge1"] });
    });
  });
});
