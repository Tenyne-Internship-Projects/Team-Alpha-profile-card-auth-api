const multer = require("multer");
const path = require("path");

//@ Use memory storage instead of saving directly to disk
const storage = multer.memoryStorage();

//@ Allowed file types for upload
const allowedTypes = /jpeg|jpg|png|pdf|svg/;

///@ This function checks if the uploaded file type is allowed
const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

  //@ If both extension and MIME type are valid, allow the file
  if (extname && mimetype) {
    cb(null, true);
  } else {
    //@ Otherwise, reject the file with an error
    cb(new Error("Only JPEG, PNG, PDF, or SVG files are allowed"));
  }
};

//@ This helper function creates a safe and unique filename
const generateSafeFilename = (originalName) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/\s+/g, "_");
  return `${baseName}_${timestamp}${ext}`;
};

//@ After multer parses the file in memory, we give each file a safe filename
const patchFilenames = (req, res, next) => {
  if (req.file) {
    //@ If there's a single file, rename it
    req.file.filename = generateSafeFilename(req.file.originalname);
  }

  //@ If there are multiple files, rename each one
  if (req.files) {
    for (const field in req.files) {
      req.files[field].forEach((file) => {
        file.filename = generateSafeFilename(file.originalname);
      });
    }
  }

  next(); // Move to next middleware
};

//@ Setup multer middleware with memory storage and file filter
const uploads = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max: 5MB
  },
});

//@ Middleware to convert a single uploaded file to base64 string
const convertToBase64 = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  //@ Convert buffer data to base64 and store in request body
  req.body.imageBase64 = req.file.buffer.toString("base64");
  next();
};

//@ Middleware to convert multiple uploaded files to base64 strings
const convertMultipleToBase64 = (req, res, next) => {
  //@ If no files, just move to next
  if (!req.files || Object.keys(req.files).length === 0) return next();

  const base64Files = {};

  //@ Convert each file's buffer to base64 string
  for (const field in req.files) {
    base64Files[field] = req.files[field].map((file) =>
      file.buffer.toString("base64")
    );
  }

  //@ Save base64 strings in request body
  req.body.base64Files = base64Files;
  next();
};

//@ Export all middleware functions
module.exports = {
  uploads,
  patchFilenames,
  convertToBase64,
  convertMultipleToBase64,
  patchFilenames,
};
