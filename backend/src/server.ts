import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { errorHandler } from "@/middleware/errorHandler";
import { notFoundHandler } from "@/middleware/notFoundHandler";
import { logger } from "@/utils/logger";
import { connectDatabase } from "@/database/connection";

// Routes
import authRoutes from "@/routes/auth";
import applicationRoutes from "@/routes/applications";
import fileRoutes from "@/routes/files";
import adminRoutes from "@/routes/admin";
import userRoutes from "@/routes/users";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"), // limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    })
);

app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || [
            "http://localhost:5173",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
);

app.use(limiter);
app.use(compression());
app.use(
    morgan("combined", {
        stream: {
            write: (message: string) => logger.info(message.trim()),
        },
    })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        service: process.env.APP_NAME || "Medical Reimbursement API",
        version: process.env.APP_VERSION || "1.0.0",
        environment: process.env.NODE_ENV || "development",
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

// API documentation endpoint
app.get("/api", (req, res) => {
    res.json({
        message: "JNU Medical Reimbursement System API",
        version: process.env.APP_VERSION || "1.0.0",
        endpoints: {
            auth: "/api/auth",
            applications: "/api/applications",
            files: "/api/files",
            admin: "/api/admin",
            users: "/api/users",
        },
        documentation: "/api/docs",
        health: "/health",
    });
});

// Error handling middleware (should be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDatabase();

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

if (require.main === module) {
    startServer();
}

export default app;
