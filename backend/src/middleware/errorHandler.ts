import { Request, Response, NextFunction } from "express";
import { logger } from "@/utils/logger";

export interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const {
        statusCode = 500,
        message = "Internal Server Error",
        stack,
    } = error;

    // Log the error
    logger.error({
        message: error.message,
        statusCode,
        stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });

    // Don't send stack trace in production
    const response: any = {
        error: {
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.path,
        },
    };

    if (process.env.NODE_ENV === "development") {
        response.error.stack = stack;
    }

    res.status(statusCode).json(response);
};

export const createError = (
    message: string,
    statusCode: number = 500
): ApiError => {
    const error: ApiError = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};

export const asyncHandler =
    (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
