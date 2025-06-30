//@ Load environment variables
require("dotenv").config();

//@ Import necessary modules
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/db");
const { errorLogger } = require("./middlewares/errorLogger");

const authRoutes = require("./routes/auth.routes");
const freelancerProfileRoutes = require("./routes/userProfile.routes");
const clientProfileRoutes = require("./routes/clientProfile.routes");
const projectRoutes = require("./routes/project.routes");
const applicationRoutes = require("./routes/applicantion.routes");
const favoriteRoutes = require("./routes/favorites.routes");

const app = express();

//@ Connect to the database
connectDB();

//@ Apply middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

//@ Define API routes (order matters!)
app.use("/api/auth", authRoutes);
app.use("/api/profile", clientProfileRoutes);
app.use("/api/profile", freelancerProfileRoutes);
app.use("/api/project/favorite", favoriteRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/applications", applicationRoutes);

//@ Root route
app.get("/", (req, res) => res.send("API is running..."));

//@ Error logger middleware
app.use(errorLogger);

//@ Global fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error" });
});

//@ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
