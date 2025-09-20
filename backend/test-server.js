// Simple test to check if the server can start
require("module-alias/register");

console.log("Starting server test...");

try {
    require("dotenv").config();
    console.log("Environment loaded");

    const logger = require("./dist/utils/logger").logger;
    console.log("Logger loaded");

    const { connectDatabase } = require("./dist/database/connection");
    console.log("Database connection loaded");

    const express = require("express");
    const app = express();

    app.get("/test", (req, res) => {
        res.json({ message: "Test successful" });
    });

    const PORT = process.env.PORT || 3001;

    app.listen(PORT, () => {
        console.log(`Test server running on port ${PORT}`);
    });
} catch (error) {
    console.error("Error starting server:", error);
}
