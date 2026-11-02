
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const connectDB = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const timeTrackingRoutes = require("./routes/timeTrackingRoutes");

// Environment Variables
dotenv.config();

// Create Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Uploaded Files
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// MongoDB Connection
connectDB();

// Default Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "TaskFlow API is Running!"
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/time-tracking", timeTrackingRoutes);

// 404 Route
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Route Not Found"
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Error:", err.message);

    // Multer Errors
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message:
                err.code === "LIMIT_FILE_SIZE"
                    ? "File size must be less than 5 MB"
                    : err.message
        });
    }

    // Invalid File Type
    if (
        err.message ===
        "Only JPG, JPEG, PNG and PDF files are allowed"
    ) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Server Error
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
