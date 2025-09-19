import express from "express";

const router = express.Router();

// Get dashboard stats
router.get("/dashboard", (req, res) => {
    res.json({ message: "Admin dashboard stats - to be implemented" });
});

// Get all applications for review
router.get("/applications", (req, res) => {
    res.json({ message: "Applications for admin review - to be implemented" });
});

// Get all users
router.get("/users", (req, res) => {
    res.json({ message: "User management - to be implemented" });
});

// System settings
router.get("/settings", (req, res) => {
    res.json({ message: "System settings - to be implemented" });
});

export default router;
