const multer = require("multer");
const path = require("path");

// Configure memory storage
const storage = multer.memoryStorage();

// Allowed file types
const allowedTypes = /jpeg|jpg|png|pdf|svg/;

// File filter to validate both mimetype and extension
const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, PDF, or SVG files are allowed"));
  }
};

// Final multer middleware
const uploads = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max: 5MB
  },
});

// Middleware: Convert single uploaded file to Base64
const convertToBase64 = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  req.body.imageBase64 = req.file.buffer.toString("base64");
  next();
};

// Middleware: Convert multiple uploaded files to Base64
const convertMultipleToBase64 = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) return next();

  const base64Files = {};

  for (const field in req.files) {
    base64Files[field] = req.files[field].map((file) =>
      file.buffer.toString("base64")
    );
  }

  req.body.base64Files = base64Files;
  next();
};

module.exports = {
  uploads,
  convertToBase64,
  convertMultipleToBase64,
};
