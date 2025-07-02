//@ Load environment variables
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
const authRoutes = require("./routes/auth.routes");
const freelancerProfileRoutes = require("./routes/userProfile.routes");
const clientProfileRoutes = require("./routes/clientProfile.routes");
const projectRoutes = require("./routes/project.routes");
const applicationRoutes = require("./routes/applicantion.routes");
const favoriteRoutes = require("./routes/favorites.routes");
const archivedRoutes = require("./routes/archivedProject.routes");

const app = express();

// Only connect DB & listen if NOT in test environment
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", clientProfileRoutes);
app.use("/api/profile", freelancerProfileRoutes);
app.use("/api/project/favorite", favoriteRoutes);
app.use("/api/project/archive", archivedRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/applications", applicationRoutes);

// Root route
app.get("/", (req, res) => res.send("API is running..."));

// 👇 Open API Docs for all environments
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error logger middleware
app.use(errorLogger);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: "Server Error" });
});

// Export the app for testing
module.exports = app;

// Only start the server if not testing
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}
