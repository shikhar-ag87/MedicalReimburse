import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { asyncHandler } from "@/middleware/errorHandler";
import { getDatabase } from "@/database/connection";
import { logger } from "@/utils/logger";
import { CreateUserData, User } from "@/types/database";

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string, email: string, role: string) => {
    return jwt.sign(
        { userId, email, role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

// Register new user
router.post(
    "/register",
    asyncHandler(async (req, res) => {
        const {
            email,
            password,
            name,
            employeeId,
            department,
            designation,
            role = "employee",
        } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: "Email, password, and name are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        try {
            const db = await getDatabase();
            const userRepo = db.getUserRepository();

            // Check if user already exists
            const existingUser = await userRepo.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User with this email already exists",
                });
            }

            // Check if employee ID is already in use (if provided)
            if (employeeId) {
                const existingEmployee = await userRepo.findByEmployeeId(
                    employeeId
                );
                if (existingEmployee) {
                    return res.status(400).json({
                        success: false,
                        message: "Employee ID is already in use",
                    });
                }
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create user data
            const userData: CreateUserData = {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                employeeId,
                department,
                designation,
                role: role as User["role"],
                isActive: true,
            };

            // Create user
            const newUser = await userRepo.create(userData);

            // Generate token
            const token = generateToken(
                newUser.id,
                newUser.email,
                newUser.role
            );

            // Log registration
            logger.info(`New user registered: ${email}`, {
                userId: newUser.id,
                role: newUser.role,
            });

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: {
                    token,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role,
                        employeeId: newUser.employeeId,
                        department: newUser.department,
                        designation: newUser.designation,
                    },
                },
            });
        } catch (error) {
            logger.error("Registration error:", error);
            throw error;
        }
    })
);

// Login user
router.post(
    "/login",
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        try {
            const db = await getDatabase();
            const userRepo = db.getUserRepository();

            // Find user by email
            const user = await userRepo.findByEmail(email.toLowerCase());
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Account is deactivated. Please contact administrator.",
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Update last login
            await userRepo.updateLastLogin(user.id);

            // Generate token
            const token = generateToken(user.id, user.email, user.role);

            // Log login
            logger.info(`User logged in: ${email}`, {
                userId: user.id,
                role: user.role,
            });

            res.json({
                success: true,
                message: "Login successful",
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        employeeId: user.employeeId,
                        department: user.department,
                        designation: user.designation,
                        lastLogin: user.lastLogin,
                    },
                },
            });
        } catch (error) {
            logger.error("Login error:", error);
            throw error;
        }
    })
);

// Get current user profile
router.get(
    "/me",
    asyncHandler(async (req, res) => {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "your-secret-key"
            ) as any;

            const db = await getDatabase();
            const userRepo = db.getUserRepository();

            // Find user
            const user = await userRepo.findById(decoded.userId);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        employeeId: user.employeeId,
                        department: user.department,
                        designation: user.designation,
                        lastLogin: user.lastLogin,
                        createdAt: user.createdAt,
                    },
                },
            });
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token",
                });
            }
            logger.error("Get profile error:", error);
            throw error;
        }
    })
);

// Logout (mainly for logging purposes, token invalidation handled client-side)
router.post(
    "/logout",
    asyncHandler(async (req, res) => {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (token) {
            try {
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET || "your-secret-key"
                ) as any;
                logger.info(`User logged out: ${decoded.email}`, {
                    userId: decoded.userId,
                });
            } catch (error) {
                // Token may be invalid, but still proceed with logout
            }
        }

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    })
);

// Change password
router.post(
    "/change-password",
    asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long",
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "your-secret-key"
            ) as any;

            const db = await getDatabase();
            const userRepo = db.getUserRepository();

            // Find user
            const user = await userRepo.findById(decoded.userId);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(
                currentPassword,
                user.password
            );
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is incorrect",
                });
            }

            // Hash new password
            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(
                newPassword,
                saltRounds
            );

            // Update password
            await userRepo.update(user.id, { password: hashedNewPassword });

            logger.info(`Password changed for user: ${user.email}`, {
                userId: user.id,
            });

            res.json({
                success: true,
                message: "Password changed successfully",
            });
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token",
                });
            }
            logger.error("Change password error:", error);
            throw error;
        }
    })
);

export default router;
