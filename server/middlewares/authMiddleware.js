const jwt = require("jsonwebtoken");

//@ Middleware to protect routes by checking for a valid JWT token
const protect = (req, res, next) => {
  // Get the token from the Authorization header (if it starts with "Bearer ")
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  // If no token is found, block access
  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // Attach user ID to request

    // Move on to the next middleware or route
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = protect;
