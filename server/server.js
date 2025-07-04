require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/db");
const { errorLogger } = require("./middlewares/errorLogger");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

// Routes
const authRoutes = require("./routes/auth.routes");
const freelancerProfileRoutes = require("./routes/userProfile.routes");
const clientProfileRoutes = require("./routes/clientProfile.routes");
const projectRoutes = require("./routes/project.routes");
const applicationRoutes = require("./routes/applicantion.routes");
const favoriteRoutes = require("./routes/favorites.routes");
const archivedRoutes = require("./routes/archivedProject.routes");

const app = express();

// Connect DB
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// CORS
const allowedOrigins = [
  "https://freebio-alpha.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", clientProfileRoutes);
app.use("/api/profile", freelancerProfileRoutes);
app.use("/api/project/favorite", favoriteRoutes);
app.use("/api/project/archive", archivedRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/applications", applicationRoutes);

// Root Route
app.get("/", (req, res) => res.send("API is running..."));

// Serve Swagger Spec as JSON
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Serve Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    swaggerOptions: {
      url: "/swagger.json", // ✅ Swagger fetches the spec
    },
  })
);

// Error Logger
app.use(errorLogger);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: "Server Error" });
});

// Start Server
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

module.exports = app;
