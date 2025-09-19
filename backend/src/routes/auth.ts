import express from "express";

const router = express.Router();

// Placeholder auth routes
router.post("/login", (req, res) => {
    res.json({ message: "Login endpoint - to be implemented" });
});

router.post("/register", (req, res) => {
    res.json({ message: "Register endpoint - to be implemented" });
});

router.post("/logout", (req, res) => {
    res.json({ message: "Logout endpoint - to be implemented" });
});

router.get("/me", (req, res) => {
    res.json({ message: "Get user profile - to be implemented" });
});

export default router;
