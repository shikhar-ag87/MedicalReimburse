import express from "express";

const router = express.Router();

// Get user profile
router.get("/profile", (req, res) => {
    res.json({ message: "User profile - to be implemented" });
});

// Update user profile
router.put("/profile", (req, res) => {
    res.json({ message: "Update user profile - to be implemented" });
});

// Get user applications
router.get("/applications", (req, res) => {
    res.json({ message: "User applications - to be implemented" });
});

export default router;
