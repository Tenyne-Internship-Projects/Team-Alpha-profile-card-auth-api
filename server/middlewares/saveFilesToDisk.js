const fs = require("fs/promises");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

//@ Define the uploads directory path
const uploadDir = path.join(__dirname, "../uploads");

//@ Make sure the uploads folder exists. If not, create it.
fs.access(uploadDir).catch(() => fs.mkdir(uploadDir));

//@ This middleware saves uploaded files (avatar and documents) to disk
const saveFilesToDisk = async (req, res, next) => {
  try {
    //@ If no files were uploaded, just move to the next middleware
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    //@ Handle avatar upload (single file)
    if (req.files.avatar && req.files.avatar[0]) {
      const avatarFile = req.files.avatar[0];
      const extension = path.extname(avatarFile.originalname);
      const generatedFilename = `avatar-${uuidv4()}${extension}`;
      const avatarPath = path.join(uploadDir, generatedFilename);

      //@ Save avatar to disk
      await fs.writeFile(avatarPath, avatarFile.buffer);
      avatarFile.filename = generatedFilename;
      req.body.avatar = `/uploads/${generatedFilename}`; // Save URL path in request body
    }

    //@ Handle multiple document uploads
    if (req.files.documents && req.files.documents.length > 0) {
      req.body.documents = await Promise.all(
        req.files.documents.map(async (docFile) => {
          const extension = path.extname(docFile.originalname);
          const generatedFilename = `doc-${uuidv4()}${extension}`;
          const docPath = path.join(uploadDir, generatedFilename);

          //@ Save each document to disk
          await fs.writeFile(docPath, docFile.buffer);
          docFile.filename = generatedFilename;
          //@ Return the saved file path
          return `/uploads/${generatedFilename}`;
        })
      );
    }

    //@ Continue to next middleware
    next();
  } catch (err) {
    //@ If there's an error, pass it to the global error handler
    next(err);
  }
};

module.exports = saveFilesToDisk;
