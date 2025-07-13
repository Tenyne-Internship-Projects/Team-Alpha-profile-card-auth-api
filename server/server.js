require("dotenv").config();

const express = require("express");
const http = require("http"); // 👈 for socket.io
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { Server } = require("socket.io"); // 👈 socket.io
const { connectDB } = require("./config/db");
const { errorLogger } = require("./middlewares/errorLogger");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();
const server = http.createServer(app); // 👈 create HTTP server
const io = new Server(server, {
  cors: {
    origin: [
      "https://freebio-alpha.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  },
});

// Attach `io` to `app` for global access (e.g., in sendNotification.js)
app.set("io", io);

// Socket.io event
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // Handle user-specific room joining
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

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

// Routes
const authRoutes = require("./routes/auth.routes");
const freelancerProfileRoutes = require("./routes/userProfile.routes");
const clientProfileRoutes = require("./routes/clientProfile.routes");
const projectRoutes = require("./routes/project.routes");
const applicationRoutes = require("./routes/applicantion.routes");
const favoriteRoutes = require("./routes/favorites.routes");
const archivedRoutes = require("./routes/archivedProject.routes");
const freelancerDashboad = require("./routes/freelancer.routes");
const clientMetrics = require("./routes/metrics.routes");
const notificationRoutes = require("./routes/notification.routes"); // ✅ New

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", clientProfileRoutes);
app.use("/api/profile", freelancerProfileRoutes);
app.use("/api/project/favorite", favoriteRoutes);
app.use("/api/project/archive", archivedRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/freelancer-dashboard", freelancerDashboad);
app.use("/api/client-metrics", clientMetrics);
app.use("/api/notifications", notificationRoutes); // ✅

app.get("/", (req, res) => res.send("API is running..."));

// Swagger JSON
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    swaggerOptions: {
      url: "/swagger.json",
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
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

module.exports = { app, server };
