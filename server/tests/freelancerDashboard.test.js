const {
  getFreelancerEarningsGraph,
  getFreelancerMetricsCards,
  getFreelancerVisitStats,
} = require("../controllers/freelancerDashboard.controller");

const { PrismaClient } = require("@prisma/client");
jest.mock("@prisma/client");

const prisma = new PrismaClient();

const mockRequest = (user = {}, query = {}, params = {}) => ({
  user,
  query,
  params,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Freelancer Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFreelancerEarningsGraph", () => {
    it("returns earnings without filters", async () => {
      const req = mockRequest({ userId: "freelancer123" });
      const res = mockResponse();

      prisma.$queryRaw.mockResolvedValue([
        { month: "2025-01", total: 200 },
        { month: "2025-02", total: 300 },
      ]);

      await getFreelancerEarningsGraph(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        freelancerId: "freelancer123",
        monthlyEarnings: expect.any(Array),
        previousYearComparison: [],
      });
    });

    it("returns filtered earnings by year and month", async () => {
      const req = mockRequest(
        { userId: "freelancer123" },
        { year: "2025", month: "6" }
      );
      const res = mockResponse();

      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { month: "2025-06", total: 500 },
      ]);

      await getFreelancerEarningsGraph(req, res);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns earnings with previous year comparison when compare=true", async () => {
      const req = mockRequest(
        { userId: "freelancer123" },
        { year: "2025", compare: "true" }
      );
      const res = mockResponse();

      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { month: "2025-01", total: 300 },
      ]);
      prisma.$queryRawUnsafe.mockResolvedValueOnce([
        { month: "2024-01", total: 150 },
      ]);

      await getFreelancerEarningsGraph(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        freelancerId: "freelancer123",
        monthlyEarnings: expect.any(Array),
        previousYearComparison: expect.any(Array),
      });
    });

    it("returns 500 on database error", async () => {
      const req = mockRequest({ userId: "freelancer123" });
      const res = mockResponse();

      prisma.$queryRaw.mockRejectedValue(new Error("DB error"));

      await getFreelancerEarningsGraph(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to retrieve earnings graph",
      });
    });
  });

  describe("getFreelancerMetricsCards", () => {
    it("returns application and project stats", async () => {
      const req = mockRequest({ userId: "freelancer123" });
      const res = mockResponse();

      prisma.application.findMany.mockResolvedValue([
        {
          status: "approved",
          project: { progressStatus: "completed", deleted: false },
        },
        {
          status: "approved",
          project: { progressStatus: "ongoing", deleted: false },
        },
        {
          status: "approved",
          project: { progressStatus: "cancelled", deleted: false },
        },
        { status: "rejected", project: null },
      ]);

      prisma.application.groupBy.mockResolvedValue([
        { status: "approved", _count: 3 },
        { status: "rejected", _count: 1 },
      ]);

      await getFreelancerMetricsCards(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        freelancerId: "freelancer123",
        projectStats: { completed: 1, ongoing: 1, cancelled: 1 },
        applicationStats: {
          total: 4,
          pending: 0,
          approved: 3,
          rejected: 1,
        },
        projects: expect.any(Array),
      });
    });

    it("returns 500 on application.findMany error", async () => {
      const req = mockRequest({ userId: "freelancer123" });
      const res = mockResponse();

      prisma.application.findMany.mockRejectedValue(new Error("Fetch failed"));

      await getFreelancerMetricsCards(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to retrieve metrics",
      });
    });
  });

  describe("getFreelancerVisitStats", () => {
    it("returns total profile visits for freelancer", async () => {
      const req = mockRequest(
        { userId: "freelancer123", role: "freelancer" },
        {},
        { userId: "freelancer123" }
      );
      const res = mockResponse();

      prisma.profileVisit.aggregate = jest.fn().mockResolvedValue({
        _sum: { count: 10 },
      });

      await getFreelancerVisitStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ totalVisits: 10 });
    });

    it("returns 403 for unauthorized user", async () => {
      const req = mockRequest(
        { userId: "otherUser", role: "client" },
        {},
        { userId: "freelancer123" }
      );
      const res = mockResponse();

      await getFreelancerVisitStats(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    });

    it("returns 500 on aggregate failure", async () => {
      const req = mockRequest(
        { userId: "freelancer123", role: "freelancer" },
        {},
        { userId: "freelancer123" }
      );
      const res = mockResponse();

      prisma.profileVisit.aggregate = jest
        .fn()
        .mockRejectedValue(new Error("Aggregation error"));

      await getFreelancerVisitStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });
});
