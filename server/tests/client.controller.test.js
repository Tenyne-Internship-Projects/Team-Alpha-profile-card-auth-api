const {
  updateClientProfile,
  getClientProfile,
  getAllClients,
  deleteClient,
} = require("../controllers/clientprofile.controller");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mock Cloudinary upload
jest.mock("../config/uploadsToCloudinary", () => ({
  uploadsToCloudinary: jest.fn(() =>
    Promise.resolve({ secure_url: "http://cloud/mock.jpg" })
  ),
}));

const mockRequest = (data) => ({
  params: data.params || {},
  body: data.body || {},
  file: data.file || null,
  user: data.user || {},
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();

  // Mock prisma.user methods
  prisma.user = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  };

  // Mock prisma.clientProfile methods
  prisma.clientProfile = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  };
});

describe("Client Controller", () => {
  describe("updateClientProfile", () => {
    it("should update or create a client profile with logo", async () => {
      const req = mockRequest({
        params: { userId: "123" },
        body: {
          companyName: "Test Co",
          hiringCategories: JSON.stringify(["Design", "Dev"]),
        },
        file: { buffer: Buffer.from("fake image") },
        user: { userId: "123" },
      });

      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValue({ id: "123", role: "client" });
      prisma.clientProfile.upsert.mockResolvedValue({ id: "profile1" });

      await updateClientProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Client profile saved successfully",
        profile: { id: "profile1" },
      });
    });

    it("should return 403 if not authorized", async () => {
      const req = mockRequest({
        params: { userId: "123" },
        user: { userId: "unauthorized" },
      });
      const res = mockResponse();

      await updateClientProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should return 404 if user is not a client", async () => {
      const req = mockRequest({
        params: { userId: "123" },
        user: { userId: "123" },
      });
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValue({
        id: "123",
        role: "freelancer",
      });

      await updateClientProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getClientProfile", () => {
    it("should return client profile", async () => {
      const req = mockRequest({ params: { userId: "123" } });
      const res = mockResponse();

      prisma.clientProfile.findUnique.mockResolvedValue({ id: "profile123" });

      await getClientProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "profile123" });
    });

    it("should return 404 if not found", async () => {
      const req = mockRequest({ params: { userId: "123" } });
      const res = mockResponse();

      prisma.clientProfile.findUnique.mockResolvedValue(null);

      await getClientProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getAllClients", () => {
    it("should return all clients", async () => {
      const req = mockRequest({});
      const res = mockResponse();

      prisma.user.findMany.mockResolvedValue([{ id: "1" }, { id: "2" }]);

      await getAllClients(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: "1" }, { id: "2" }]);
    });
  });

  describe("deleteClient", () => {
    it("should delete client and profile", async () => {
      const req = mockRequest({ params: { userId: "123" } });
      const res = mockResponse();

      prisma.clientProfile.deleteMany.mockResolvedValue({});
      prisma.user.delete.mockResolvedValue({});

      await deleteClient(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Client deleted successfully",
      });
    });
  });
});
