const multer = require("multer");

// Use memory storage instead of disk
const storage = multer.memoryStorage();

// Allowed MIME types (images, videos, documents)
const allowedMimeTypes = [
  // Images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",

  // Videos
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/x-matroska", // .mkv
  "video/webm",

  // Documents
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "text/plain", // .txt
  "text/csv", // .csv
];

// File filter function
const checkFileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type! Allowed: images, videos, PDFs, Word, Excel, PowerPoint, TXT, CSV."
      )
    );
  }
};

// Multer middleware
const upload = multer({
  storage,
  fileFilter: checkFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
});

module.exports = { upload };
