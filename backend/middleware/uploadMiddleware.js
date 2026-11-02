
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Upload Folder
const uploadPath = path.join(__dirname, "..", "uploads");

// Create folder if it does not exist
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);
    }
});

// File Validation
const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];

    const extension = path.extname(file.originalname).toLowerCase();

    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];

    if (
        allowedExtensions.includes(extension) &&
        allowedMimeTypes.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, JPEG, PNG and PDF files are allowed"));
    }
};

// Multer Configuration
const upload = multer({
    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: fileFilter
});

module.exports = upload;
