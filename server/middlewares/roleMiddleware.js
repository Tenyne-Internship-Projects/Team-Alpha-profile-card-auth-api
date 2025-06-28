const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    console.log("🔎 Checking user role:", userRole);
    console.log("✅ Allowed roles:", allowedRoles);

    if (!allowedRoles.includes(userRole)) {
      console.log("❌ Access denied for role:", userRole);
      return res.status(403).json({ message: "Access denied" });
    }

    console.log("✅ Access granted to role:", userRole);
    next();
  };
};

module.exports = authorizeRoles;
