import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { requestLogger } from "./middleware/requestLogger";
import { validateApiKey } from "./middleware/auth";
import { logger } from "./utils/logger";
import { setupSwagger } from "./config/swagger";

// Import route handlers
import authRoutes from "./routes/auth";
import applicationRoutes from "./routes/applications";
import fileRoutes from "./routes/files";
import adminRoutes from "./routes/admin";
import userRoutes from "./routes/users";
import reviewRoutes from "./routes/reviews";

// Load environment variables
dotenv.config();

export function createApp(): express.Express {
    const app = express();

    // Trust proxy for accurate IP addresses
    app.set("trust proxy", 1);

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            error: "Too many requests from this IP, please try again later.",
        },
        standardHeaders: true,
        legacyHeaders: false,
    });

    // Apply rate limiting to all requests
    app.use(limiter);

    // Security middleware
    app.use(helmet());
    app.use(
        cors({
            origin: process.env.FRONTEND_URL || "*",
            credentials: true,
        })
    );
    app.use(compression());

    // Logging middleware
    if (process.env.NODE_ENV !== "test") {
        app.use(
            morgan("combined", {
                stream: {
                    write: (message: string) => logger.info(message.trim()),
                },
            })
        );
        app.use(requestLogger);
    }

    // Body parsing middleware
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));

    // API documentation
    setupSwagger(app);

    // Health check endpoint
    app.get("/health", (req, res) => {
        res.status(200).json({
            status: "OK",
            timestamp: new Date().toISOString(),
            service: "JNU Medical Reimbursement System API",
            version: process.env.npm_package_version || "1.0.0",
            environment: process.env.NODE_ENV || "development",
        });
    });

    // API info endpoint
    app.get("/api", (req, res) => {
        res.status(200).json({
            name: "JNU Medical Reimbursement System API",
            version: process.env.npm_package_version || "1.0.0",
            description: "API for managing medical reimbursement applications",
            environment: process.env.NODE_ENV || "development",
            endpoints: {
                health: "/health",
                documentation: "/api/docs",
                openapi_spec: "/api/docs.json",
                auth: "/api/auth",
                applications: "/api/applications",
                files: "/api/files",
                admin: "/api/admin",
                users: "/api/users",
                reviews: "/api/reviews",
            },
            timestamp: new Date().toISOString(),
        });
    });

    // API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/applications", applicationRoutes);
    app.use("/api/files", fileRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/reviews", reviewRoutes);

    // 404 handler
    app.use(notFoundHandler);

    // Error handling middleware (must be last)
    app.use(errorHandler);

    return app;
}

// Default export for compatibility
export default createApp();
