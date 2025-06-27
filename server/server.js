//@ Load performance monitoring tool (e.g., OpenTelemetry or custom)
// require("./instrument");

//@ Load environment variables
require("dotenv").config();

//@ Increase default max listeners to prevent memory leaks in development
require("events").EventEmitter.defaultMaxListeners = 20;

//@ Load necessary modules
const fs = require("fs");
const path = require("path");

//@ Define the path for storing uploaded badge files
const badgeDir = path.join(__dirname, "uploads", "badges");

//@ Create the uploads/badges directory if it doesn't exist
if (!fs.existsSync(badgeDir)) {
  fs.mkdirSync(badgeDir, { recursive: true });
  console.log("[Init] Created uploads/badges directory");
}

//@ Import necessary modules
const express = require("express");
const app = express();

const cors = require("cors");
const { connectDB } = require("./config/db");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { errorLogger } = require("./middlewares/errorLogger");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/profileRoutes");

//@ Connect to the database
connectDB();

//@ Apply common middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

//@ Serve uploaded files (like avatars or badges)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//@ Setup API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", userRoutes);

//@ Basic fallback route
app.get("/", (req, res) => res.send("API is running..."));

//@ Custom error logger middleware
app.use(errorLogger);

//@ Final fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error" });
});

//@ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
