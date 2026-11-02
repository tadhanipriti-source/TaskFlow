const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    createTask,
    getTasks,
    getSingleTask,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

// Create Task with File Upload
router.post("/", protect, upload.single("attachment"), createTask);

// Get All Tasks
router.get("/", protect, getTasks);

// Get Single Task
router.get("/:id", protect, getSingleTask);

// Update Task with Optional File Upload
router.put("/:id", protect, upload.single("attachment"), updateTask);

// Delete Task
router.delete("/:id", protect, deleteTask);

module.exports = router;