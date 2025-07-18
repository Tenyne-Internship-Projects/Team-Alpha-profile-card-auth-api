// server/tests/freelancerDashboard.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const {
  getFreelancerEarningsGraph,
  getFreelancerMetricsCards,
  getFreelancerVisitStats,
  getFreelancerPaymentStatus,
} = require("../controllers/freelancerDashboard.controller");

jest.mock("@prisma/client", () => {
  const mPrisma = {
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    application: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    profileVisit: {
      aggregate: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mPrisma),
  };
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mock Express app
const app = express();
app.use(bodyParser.json());

// Inject req.user mock middleware
const mockAuth = (req, res, next) => {
  req.user = { userId: "freelancer123", role: "freelancer" };
  next();
};

app.get("/earnings", mockAuth, getFreelancerEarningsGraph);
app.get("/metrics", mockAuth, getFreelancerMetricsCards);
app.get("/visits/:userId", mockAuth, getFreelancerVisitStats);
app.get("/payments", mockAuth, getFreelancerPaymentStatus);

describe("Freelancer Dashboard Controllers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GET /earnings - returns monthly earnings", async () => {
    prisma.$queryRaw.mockResolvedValue([
      { month: "2024-06", total: 500 },
      { month: "2024-07", total: 800 },
    ]);
    prisma.$queryRawUnsafe.mockResolvedValue([]);

    const res = await request(app).get("/earnings");

    expect(res.statusCode).toBe(200);
    expect(res.body.freelancerId).toBe("freelancer123");
    expect(res.body.monthlyEarnings.length).toBe(2);
  });

  test("GET /metrics - returns metrics cards", async () => {
    prisma.application.findMany.mockResolvedValue([
      {
        status: "approved",
        project: { deleted: false, progressStatus: "completed" },
      },
      {
        status: "approved",
        project: { deleted: false, progressStatus: "ongoing" },
      },
      {
        status: "approved",
        project: { deleted: false, progressStatus: "cancelled" },
      },
    ]);
    prisma.application.groupBy.mockResolvedValue([
      { status: "approved", _count: 3 },
    ]);

    const res = await request(app).get("/metrics");

    expect(res.statusCode).toBe(200);
    expect(res.body.projectStats.completed).toBe(1);
    expect(res.body.projectStats.ongoing).toBe(1);
    expect(res.body.projectStats.cancelled).toBe(1);
    expect(res.body.applicationStats.total).toBe(3);
  });

  test("GET /visits/:userId - returns visit stats if requester is freelancer", async () => {
    prisma.profileVisit.aggregate.mockResolvedValue({
      _sum: { count: 10 },
    });

    const res = await request(app).get("/visits/freelancer123");

    expect(res.statusCode).toBe(200);
    expect(res.body.totalVisits).toBe(10);
  });

  test("GET /visits/:userId - denies access if not the same freelancer", async () => {
    const res = await request(app).get("/visits/otherUser");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Access denied");
  });

  test("GET /payments - returns payment status", async () => {
    prisma.application.findMany.mockResolvedValue([
      {
        project: {
          deleted: false,
          progressStatus: "ongoing",
          paymentId: null,
          budget: 1000,
        },
      },
      {
        project: {
          deleted: false,
          progressStatus: "completed",
          paymentId: "pay_123",
          budget: 2000,
        },
      },
    ]);

    const res = await request(app).get("/payments");

    expect(res.statusCode).toBe(200);
    expect(res.body.payments.pending.count).toBe(1);
    expect(res.body.payments.completed.count).toBe(1);
    expect(res.body.payments.pending.totalBudget).toBe(1000);
    expect(res.body.payments.completed.totalBudget).toBe(2000);
  });
});
