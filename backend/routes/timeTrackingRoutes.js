
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    startTracking,
    pauseTracking,
    getTrackingHistory,
    getActiveTracking
} = require("../controllers/timeTrackingController");

// Start or Resume Timer
router.post("/start", protect, startTracking);

// Pause Timer
router.post("/pause", protect, pauseTracking);

// Get Tracking History
router.get("/history", protect, getTrackingHistory);

// Get Active Timer
router.get("/active", protect, getActiveTracking);

module.exports = router;
