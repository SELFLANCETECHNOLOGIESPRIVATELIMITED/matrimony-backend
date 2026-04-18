const fs = require("fs");
const { cloudinary, isCloudinaryConfigured } = require("../services/cloudinary");

const uploadFileController = {
  async uploadFile(req, res) {
    console.log("req.file", req.file);
    const filePath = req?.file?.path;

    try {
      if (!req.file) {
        return res.status(400).json({ status: false, message: "No file uploaded" });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          status: false,
          message:
            "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        });
      }

      const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "UserImages";
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      });

      console.log("publicUrl", uploadResult.secure_url);
      return res.status(200).json({
        status: true,
        fileUrl: uploadResult.secure_url,
      });
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      res.status(500).json({ status: "Failure", error: error.message });
    } finally {
      if (filePath) {
        fs.promises.unlink(filePath).catch(() => null);
      }
    }
  },
};

module.exports = uploadFileController;
