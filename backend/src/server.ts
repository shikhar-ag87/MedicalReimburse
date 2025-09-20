import "module-alias/register";
import dotenv from "dotenv";
import { createApp } from "./app";
import { logger } from "./utils/logger";
import { connectDatabase } from "./database/connection";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // Create Express application
        const app = createApp();

        // Connect to database
        await connectDatabase();

        // Start server
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
            logger.info(`Database: ${process.env.DATABASE_TYPE}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            logger.info(`API docs: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        logger.error("Failed to start server:", error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});

process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}

// Export app for testing
export default createApp();
