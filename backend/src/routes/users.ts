import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { asyncHandler } from "@/middleware/errorHandler";
import { getDatabase } from "@/database/connection";
import { logger } from "@/utils/logger";
import { CreateAuditLogData } from "@/types/database";

const router = express.Router();

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token required",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as any;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

// Get current user profile
router.get(
    "/profile",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const userRepo = db.getUserRepository();

            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Account is deactivated",
                });
            }

            // Return user profile without password
            const { password, ...userProfile } = user;

            res.json({
                success: true,
                data: {
                    user: userProfile,
                },
                message: "User profile retrieved successfully",
            });
        } catch (error) {
            logger.error("Get user profile error:", error);
            throw error;
        }
    })
);

// Update user profile
router.put(
    "/profile",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const { name, designation, department, mobileNumber } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        try {
            const db = await getDatabase();
            const userRepo = db.getUserRepository();
            const auditRepo = db.getAuditLogRepository();

            // Check if user exists and is active
            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Account is deactivated",
                });
            }

            // Prepare update data
            const updateData = {
                name: name.trim(),
                designation: designation?.trim(),
                department: department?.trim(),
            };

            // Remove undefined values
            const cleanUpdateData = Object.fromEntries(
                Object.entries(updateData).filter(
                    ([_, v]) => v !== undefined && v !== ""
                )
            );

            // Update user profile
            const updatedUser = await userRepo.update(userId, cleanUpdateData);

            if (!updatedUser) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to update profile",
                });
            }

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "user",
                entityId: userId,
                action: "update",
                userId: userId,
                userEmail: user.email,
                changes: {
                    updatedFields: Object.keys(cleanUpdateData),
                    oldValues: {
                        name: user.name,
                        designation: user.designation,
                        department: user.department,
                    },
                    newValues: cleanUpdateData,
                },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent"),
            };
            await auditRepo.create(auditData);

            logger.info("User profile updated", {
                userId,
                updatedFields: Object.keys(cleanUpdateData),
            });

            // Return updated profile without password
            const { password, ...userProfile } = updatedUser;

            res.json({
                success: true,
                data: {
                    user: userProfile,
                },
                message: "Profile updated successfully",
            });
        } catch (error) {
            logger.error("Update user profile error:", error);
            throw error;
        }
    })
);

// Get user's applications
router.get(
    "/applications",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const {
            status,
            page = 1,
            limit = 10,
            sortBy = "submittedAt",
            sortOrder = "desc",
        } = req.query;

        try {
            const db = await getDatabase();
            const userRepo = db.getUserRepository();
            const applicationRepo = db.getMedicalApplicationRepository();

            // Check if user exists and is active
            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Account is deactivated",
                });
            }

            // Get user's applications
            let applications = await applicationRepo.findByEmployeeId(
                user.employeeId || user.id
            );

            // Filter by status if provided
            if (status) {
                applications = applications.filter(
                    (app) => app.status === status
                );
            }

            // Sort applications
            applications.sort((a, b) => {
                const aValue = a[sortBy as keyof typeof a];
                const bValue = b[sortBy as keyof typeof b];

                if (sortOrder === "asc") {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            // Pagination
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedApplications = applications.slice(
                startIndex,
                endIndex
            );

            // Get additional details for each application
            const enrichedApplications = await Promise.all(
                paginatedApplications.map(async (app) => {
                    const expenseRepo = db.getExpenseItemRepository();
                    const documentRepo = db.getApplicationDocumentRepository();

                    const expenses = await expenseRepo.findByApplicationId(
                        app.id
                    );
                    const documents = await documentRepo.findByApplicationId(
                        app.id
                    );

                    return {
                        ...app,
                        expenseCount: expenses.length,
                        documentCount: documents.length,
                        totalExpenseClaimed: expenses.reduce(
                            (sum, exp) => sum + exp.amountClaimed,
                            0
                        ),
                        totalExpensePassed: expenses.reduce(
                            (sum, exp) => sum + exp.amountPassed,
                            0
                        ),
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    applications: enrichedApplications,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: applications.length,
                        totalPages: Math.ceil(
                            applications.length / Number(limit)
                        ),
                    },
                    filters: {
                        status,
                        sortBy,
                        sortOrder,
                    },
                },
                message: "User applications retrieved successfully",
            });
        } catch (error) {
            logger.error("Get user applications error:", error);
            throw error;
        }
    })
);

// Get user's application statistics
router.get(
    "/stats",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const userRepo = db.getUserRepository();
            const applicationRepo = db.getMedicalApplicationRepository();

            // Check if user exists and is active
            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Account is deactivated",
                });
            }

            // Get user's applications
            const applications = await applicationRepo.findByEmployeeId(
                user.employeeId || user.id
            );

            // Calculate statistics
            const stats = {
                total: applications.length,
                pending: applications.filter((app) => app.status === "pending")
                    .length,
                underReview: applications.filter(
                    (app) => app.status === "under_review"
                ).length,
                approved: applications.filter(
                    (app) => app.status === "approved"
                ).length,
                rejected: applications.filter(
                    (app) => app.status === "rejected"
                ).length,
                completed: applications.filter(
                    (app) => app.status === "completed"
                ).length,
                totalAmountClaimed: applications.reduce(
                    (sum, app) => sum + app.totalAmountClaimed,
                    0
                ),
                totalAmountPassed: applications.reduce(
                    (sum, app) => sum + app.totalAmountPassed,
                    0
                ),
                averageProcessingTime: 0, // You could calculate this based on submission and approval dates
                recentApplications: applications
                    .sort(
                        (a, b) =>
                            new Date(b.submittedAt).getTime() -
                            new Date(a.submittedAt).getTime()
                    )
                    .slice(0, 3),
            };

            res.json({
                success: true,
                data: stats,
                message: "User statistics retrieved successfully",
            });
        } catch (error) {
            logger.error("Get user stats error:", error);
            throw error;
        }
    })
);

// Change password
router.post(
    "/change-password",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password, new password, and confirmation are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long",
            });
        }

        try {
            const db = await getDatabase();
            const userRepo = db.getUserRepository();
            const auditRepo = db.getAuditLogRepository();

            // Get user
            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Account is deactivated",
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
            await userRepo.update(userId, { password: hashedNewPassword });

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "user",
                entityId: userId,
                action: "update",
                userId: userId,
                userEmail: user.email,
                changes: { action: "password_changed" },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent"),
            };
            await auditRepo.create(auditData);

            logger.info("User password changed", { userId });

            res.json({
                success: true,
                message: "Password changed successfully",
            });
        } catch (error) {
            logger.error("Change password error:", error);
            throw error;
        }
    })
);

// Delete user account (deactivate)
router.delete(
    "/account",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required to delete account",
            });
        }

        try {
            const db = await getDatabase();
            const userRepo = db.getUserRepository();
            const applicationRepo = db.getMedicalApplicationRepository();
            const auditRepo = db.getAuditLogRepository();

            // Get user
            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: "Incorrect password",
                });
            }

            // Check for pending applications
            const pendingApplications = await applicationRepo.findByEmployeeId(
                user.employeeId || user.id
            );
            const hasPendingApplications = pendingApplications.some((app) =>
                ["pending", "under_review"].includes(app.status)
            );

            if (hasPendingApplications) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Cannot delete account with pending or under review applications. Please wait for them to be processed or cancel them first.",
                });
            }

            // Deactivate user instead of actual deletion (for audit purposes)
            await userRepo.update(userId, { isActive: false });

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "user",
                entityId: userId,
                action: "delete",
                userId: userId,
                userEmail: user.email,
                changes: { action: "account_deactivated_by_user" },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent"),
            };
            await auditRepo.create(auditData);

            logger.info("User account deactivated by user", {
                userId,
                email: user.email,
            });

            res.json({
                success: true,
                message: "Account deactivated successfully",
            });
        } catch (error) {
            logger.error("Delete user account error:", error);
            throw error;
        }
    })
);

export default router;
