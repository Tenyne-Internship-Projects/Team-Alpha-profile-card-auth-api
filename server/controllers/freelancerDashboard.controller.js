const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { startOfMonth, endOfMonth } = require("date-fns");

const getFreelancerEarningsGraph = async (req, res) => {
  try {
    const freelancerId = req.user.userId;
    const { year, month, compare } = req.query;

    let earnings;

    if (year || month) {
      const whereConditions = [`"freelancerId" = '${freelancerId}'`];

      if (year) {
        whereConditions.push(`EXTRACT(YEAR FROM "paidAt") = ${year}`);
      }

      if (month) {
        whereConditions.push(`EXTRACT(MONTH FROM "paidAt") = ${month}`);
      }

      earnings = await prisma.$queryRawUnsafe(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "paidAt"), 'YYYY-MM') AS month,
          SUM("amount")::FLOAT AS total
        FROM "payments"
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY month
        ORDER BY month ASC
      `);
    } else {
      earnings = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "paidAt"), 'YYYY-MM') AS month,
          SUM("amount")::FLOAT AS total
        FROM "payments"
        WHERE "freelancerId" = ${freelancerId}
        GROUP BY month
        ORDER BY month ASC
      `;
    }

    let comparisonData = [];
    if (compare && year) {
      const prevYear = Number(year) - 1;

      comparisonData = await prisma.$queryRawUnsafe(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "paidAt"), 'YYYY-MM') AS month,
          SUM("amount")::FLOAT AS total
        FROM "payments"
        WHERE "freelancerId" = '${freelancerId}' 
        AND EXTRACT(YEAR FROM "paidAt") = ${prevYear}
        GROUP BY month
        ORDER BY month ASC
      `);
    }

    return res.status(200).json({
      freelancerId,
      monthlyEarnings: earnings,
      previousYearComparison: comparisonData,
    });
  } catch (err) {
    console.error("[Earnings Graph Error]", err);
    return res
      .status(500)
      .json({ message: "Failed to retrieve earnings graph" });
  }
};

const getFreelancerMetricsCards = async (req, res) => {
  try {
    const freelancerId = req.user.userId;

    // Get all applications with project info
    const allApplications = await prisma.application.findMany({
      where: {
        freelancerId,
      },
      include: { project: true },
    });

    // Filter only approved applications with non-deleted projects
    const approvedApplications = allApplications.filter(
      (app) => app.status === "approved" && app.project && !app.project.deleted
    );

    // Initialize project status counters
    let completed = 0;
    let ongoing = 0;
    let cancelled = 0;

    approvedApplications.forEach(({ project }) => {
      if (project.progressStatus === "completed") completed++;
      else if (project.progressStatus === "ongoing") ongoing++;
      else if (project.progressStatus === "cancelled") cancelled++;
    });

    // Count application statuses
    const applicationStats = await prisma.application.groupBy({
      by: ["status"],
      where: { freelancerId },
      _count: true,
    });

    const statusCount = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    const totalApplications = applicationStats.reduce((acc, item) => {
      statusCount[item.status] = item._count;
      return acc + item._count;
    }, 0);

    // Collect unique non-deleted approved projects
    const projects = approvedApplications.map((app) => app.project);

    return res.status(200).json({
      freelancerId,
      projectStats: { completed, ongoing, cancelled },
      applicationStats: {
        total: totalApplications,
        ...statusCount,
      },
      projects, // return non-deleted approved projects
    });
  } catch (err) {
    console.error("[Freelancer Metrics Error]", err);
    return res.status(500).json({ message: "Failed to retrieve metrics" });
  }
};

module.exports = {
  getFreelancerEarningsGraph,
  getFreelancerMetricsCards,
};
