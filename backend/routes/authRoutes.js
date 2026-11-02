
const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    changePassword,
    updateProfilePhoto
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const profileUpload = require("../middleware/profileUploadMiddleware");

// Register & Login
router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile Management
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Profile Photo Upload
router.put(
    "/profile/photo",
    protect,
    profileUpload.single("profileImage"),
    updateProfilePhoto
);

module.exports = router;
