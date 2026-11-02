
const TimeEntry = require("../models/TimeEntry");
const Task = require("../models/Task");

// Start or Resume Timer
const startTracking = async (req, res) => {
    try {
        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "Please select a task"
            });
        }

        // Check task belongs to logged-in user
        const task = await Task.findOne({
            _id: taskId,
            user: req.user.id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // Check whether another timer is already running
        const runningEntry = await TimeEntry.findOne({
            user: req.user.id,
            status: "Running"
        });

        if (runningEntry) {
            if (runningEntry.task.toString() === taskId) {
                return res.status(200).json({
                    success: true,
                    message: "Timer is already running",
                    entry: runningEntry
                });
            }

            return res.status(400).json({
                success: false,
                message: "Please pause the currently running timer first"
            });
        }

        // Resume previous paused session for this task
        let entry = await TimeEntry.findOne({
            user: req.user.id,
            task: taskId,
            status: "Paused"
        }).sort({ updatedAt: -1 });

        if (entry) {
            entry.startedAt = new Date();
            entry.endedAt = null;
            entry.status = "Running";

            await entry.save();
        } else {
            // Create new tracking session
            entry = await TimeEntry.create({
                task: taskId,
                user: req.user.id,
                startedAt: new Date(),
                durationSeconds: 0,
                status: "Running"
            });
        }

        res.status(200).json({
            success: true,
            message: "Timer started successfully",
            entry
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Pause Timer
const pauseTracking = async (req, res) => {
    try {
        const entry = await TimeEntry.findOne({
            user: req.user.id,
            status: "Running"
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "No running timer found"
            });
        }

        const now = new Date();

        // Calculate elapsed seconds
        const elapsedSeconds = Math.max(
            0,
            Math.floor((now - entry.startedAt) / 1000)
        );

        // Add elapsed time to previous duration
        entry.durationSeconds += elapsedSeconds;
        entry.endedAt = now;
        entry.status = "Paused";

        await entry.save();

        res.status(200).json({
            success: true,
            message: "Timer paused successfully",
            entry
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get Tracking History
const getTrackingHistory = async (req, res) => {
    try {
        const history = await TimeEntry.find({
            user: req.user.id,
            status: "Paused"
        })
            .populate("task", "title")
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: history.length,
            history
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get Currently Running Timer
const getActiveTracking = async (req, res) => {
    try {
        const entry = await TimeEntry.findOne({
            user: req.user.id,
            status: "Running"
        }).populate("task", "title");

        res.status(200).json({
            success: true,
            entry
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    startTracking,
    pauseTracking,
    getTrackingHistory,
    getActiveTracking
};
