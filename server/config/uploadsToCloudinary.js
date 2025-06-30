// uploadsToCloudinary.js
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

const uploadsToCloudinary = (fileBuffer, folder = "uploads") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.log("Cloudinary upload error:", error.message);
          return reject(error);
        }

        if (!result?.secure_url) {
          return reject(
            new Error("Cloudinary upload failed: secure_url missing")
          );
        }

        console.log(`Uploaded to Cloudinary: ${result.secure_url}`);
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    bufferToStream(fileBuffer).pipe(stream);
  });
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (err) {
    console.log("Cloudinary delete error:", err.message);
    throw err;
  }
};

module.exports = {
  uploadsToCloudinary,
  deleteFromCloudinary,
};
