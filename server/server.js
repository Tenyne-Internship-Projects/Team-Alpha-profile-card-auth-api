require("./instrument");
require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 20;

const fs   = require("fs");
const path = require("path");


const badgeDir = path.join(__dirname, "uploads", "badges");

if (!fs.existsSync(badgeDir)) {
  fs.mkdirSync(badgeDir, { recursive: true });
  console.log("[Init] Created uploads/badges directory");
}

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorLogger } = require("./middlewares/errorLogger");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/profileRoutes");

const Sentry = require("@sentry/node");

const isProduction = process.env.NODE_ENV === "production";

// Initialize Sentry before anything else
if (isProduction && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

const app = express();
connectDB();

if (isProduction) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler()); // optional
}

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// // Routes

app.use("/api/auth", authRoutes);
app.use("/api/profile", userRoutes);

app.get("/debug-sentry", (req, res) => {
  throw new Error("Sentry test error");
});

// Error handler must come AFTER routes
if (isProduction) {
  app.use(Sentry.Handlers.errorHandler());
}

// Custom error logging
app.use(errorLogger);

// Fallback
app.get("/", (req, res) => res.send("API is running..."));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
