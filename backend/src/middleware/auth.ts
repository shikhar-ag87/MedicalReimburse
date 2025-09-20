import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

export const validateApiKey = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const apiKey = req.header("X-API-Key");

    if (!apiKey) {
        res.status(401).json({
            success: false,
            message: "API key is required",
        });
        return;
    }

    if (apiKey !== process.env.API_KEY) {
        logger.warn("Invalid API key attempt", {
            apiKey: apiKey.substring(0, 8) + "...",
            ip: req.ip,
            userAgent: req.get("User-Agent"),
        });
        res.status(401).json({
            success: false,
            message: "Invalid API key",
        });
        return;
    }

    next();
};

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Access token is required",
        });
        return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        logger.error("JWT_SECRET not configured");
        res.status(500).json({
            success: false,
            message: "Authentication configuration error",
        });
        return;
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            logger.warn("Invalid token attempt", {
                error: err.message,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
            });
            res.status(403).json({
                success: false,
                message: "Invalid or expired token",
            });
            return;
        }

        req.user = decoded as any;
        next();
    });
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Insufficient permissions",
            });
            return;
        }

        next();
    };
};
