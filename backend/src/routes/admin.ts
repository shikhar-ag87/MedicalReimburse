import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/errorHandler";
import { getDatabase } from "../database/connection";
import { logger } from "../utils/logger";
import { CreateAuditLogData } from "../types/database";
import { SupabaseConnection } from "../database/providers/supabase";

const router = express.Router();

// Authentication middleware for admin routes
const authenticateAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Access token required",
        });
        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as any;

        // Check if user has admin privileges
        if (
            !["admin", "super_admin", "medical_officer"].includes(decoded.role)
        ) {
            res.status(403).json({
                success: false,
                message: "Admin privileges required",
            });
            return;
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
        return;
    }
};

// Get dashboard statistics
router.get(
    "/dashboard",
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const adminUserRepo = db.getUserRepository(); // This will be admin users now

            // Get application statistics
            const applicationStats =
                await applicationRepo.getApplicationStats();

            // Get admin user statistics
            const totalAdmins = await adminUserRepo.count();
            const adminUsers = await adminUserRepo.findByRole("admin");
            const superAdmins = await adminUserRepo.findByRole("super_admin");
            const medicalOfficers = await adminUserRepo.findByRole(
                "medical_officer"
            );

            // Get applications for review (pending and under review)
            const pendingApplications = await applicationRepo.findByStatus(
                "pending"
            );
            const reviewApplications = await applicationRepo.findByStatus(
                "under_review"
            );
            
            // Get all applications for recent activity (for Super Admin dashboard)
            const allApplications = await applicationRepo.findAll();

            const dashboardData = {
                applications: {
                    ...applicationStats,
                    pendingCount: pendingApplications.length,
                    underReviewCount: reviewApplications.length,
                    // Show all recent applications sorted by date (not just pending/under_review)
                    recentApplications: allApplications
                        .sort(
                            (a, b) =>
                                new Date(b.submittedAt).getTime() -
                                new Date(a.submittedAt).getTime()
                        )
                        .slice(0, 5),
                },
                users: {
                    total: totalAdmins,
                    admins: adminUsers.length,
                    employees: 0, // Admin users table doesn't have employees
                    medicalOfficers: medicalOfficers.length,
                    recentUsers: await adminUserRepo.findAll(), // Recent admin users
                },
                system: {
                    serverUptime: process.uptime(),
                    nodeVersion: process.version,
                    environment: process.env.NODE_ENV || "development",
                    lastUpdated: new Date().toISOString(),
                },
            };

            res.json({
                success: true,
                data: dashboardData,
                message: "Dashboard statistics retrieved successfully",
            });
        } catch (error) {
            logger.error("Dashboard stats error:", error);
            throw error;
        }
    })
);

// Get all applications for admin review
router.get(
    "/applications",
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const {
            status,
            page = 1,
            limit = 20,
            sortBy = "submittedAt",
            sortOrder = "desc",
        } = req.query;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();

            let applications;
            if (status) {
                applications = await applicationRepo.findByStatus(
                    status as any
                );
            } else {
                applications = await applicationRepo.findAll();
            }

            // Sort applications
            applications.sort((a, b) => {
                const aValue = a[sortBy as keyof typeof a];
                const bValue = b[sortBy as keyof typeof b];

                if (aValue === undefined && bValue === undefined) return 0;
                if (aValue === undefined) return 1;
                if (bValue === undefined) return -1;

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

            // Collect application IDs for aggregated lookups
            const applicationIds = paginatedApplications.map((app) => app.id);

            // Prepare review summaries
            const reviewSummaryMap: Record<
                string,
                {
                    totalReviews: number;
                    lastDecision?: string;
                    lastReviewedAt?: string;
                }
            > = {};

            if (applicationIds.length > 0) {
                try {
                    const supabaseClient = (db as SupabaseConnection).getClient();

                    const { data: reviewRows, error: reviewError } =
                        await supabaseClient
                            .from("application_reviews")
                            .select(
                                "application_id, decision, review_completed_at"
                            )
                            .in("application_id", applicationIds);

                    if (reviewError && reviewError.code !== "PGRST116") {
                        throw reviewError;
                    }

                    reviewRows?.forEach((row) => {
                        const existing = reviewSummaryMap[row.application_id] || {
                            totalReviews: 0,
                        };

                        existing.totalReviews += 1;

                        const currentTimestamp = row.review_completed_at
                            ? new Date(row.review_completed_at).getTime()
                            : null;
                        const existingTimestamp = existing.lastReviewedAt
                            ? new Date(existing.lastReviewedAt).getTime()
                            : null;

                        if (
                            currentTimestamp !== null &&
                            (existingTimestamp === null ||
                                currentTimestamp > existingTimestamp)
                        ) {
                            existing.lastReviewedAt = row.review_completed_at;
                            existing.lastDecision = row.decision;
                        }

                        reviewSummaryMap[row.application_id] = existing;
                    });
                } catch (summaryError) {
                    logger.warn(
                        "Failed to load review summaries for applications",
                        summaryError
                    );
                }
            }

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
                        expenses: expenses, // Include full expense array
                        documents: documents, // Include full documents array
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
                        reviewSummary:
                            reviewSummaryMap[app.id] ||
                            ({ totalReviews: 0 } as const),
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
                message: "Applications retrieved successfully",
            });
        } catch (error) {
            logger.error("Admin applications error:", error);
            throw error;
        }
    })
);

// Get all admin users for admin management
router.get(
    "/users",
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { role, page = 1, limit = 20, active } = req.query;

        try {
            const db = await getDatabase();
            const adminUserRepo = db.getUserRepository();

            let adminUsers;
            if (role) {
                adminUsers = await adminUserRepo.findByRole(role as any);
            } else {
                adminUsers = await adminUserRepo.findAll();
            }

            // Filter by active status if specified
            if (active !== undefined) {
                const isActive = active === "true";
                adminUsers = adminUsers.filter(
                    (user) => user.isActive === isActive
                );
            }

            // Remove password field for security
            const safeAdminUsers = adminUsers.map(
                ({ password, ...user }) => user
            );

            // Pagination
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedAdmins = safeAdminUsers.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    users: paginatedAdmins,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: adminUsers.length,
                        totalPages: Math.ceil(
                            adminUsers.length / Number(limit)
                        ),
                    },
                    filters: {
                        role,
                        active,
                    },
                },
                message: "Admin users retrieved successfully",
            });
        } catch (error) {
            logger.error("Admin users error:", error);
            throw error;
        }
    })
);

// Update user status (activate/deactivate)
router.patch(
    "/users/:userId/status",
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        const { isActive } = req.body;

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (!userId) {
            res.status(400).json({
                success: false,
                message: "User ID is required",
            });
            return;
        }

        const adminUserId = req.user.userId;

        if (typeof isActive !== "boolean") {
            res.status(400).json({
                success: false,
                message: "isActive must be a boolean value",
            });
            return;
        }

        try {
            const db = await getDatabase();
            const adminUserRepo = db.getUserRepository();
            const auditRepo = db.getAuditLogRepository();

            // Check if admin user exists
            const targetAdminUser = await adminUserRepo.findById(userId);
            if (!targetAdminUser) {
                res.status(404).json({
                    success: false,
                    message: "Admin user not found",
                });
                return;
            }

            // Prevent admin from deactivating themselves
            if (userId === adminUserId && !isActive) {
                res.status(400).json({
                    success: false,
                    message: "You cannot deactivate your own account",
                });
                return;
            }

            // Update admin user status
            const updatedAdminUser = await adminUserRepo.update(userId, {
                isActive,
            });

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "user",
                entityId: userId,
                action: "update",
                changes: {
                    oldStatus: targetAdminUser.isActive,
                    newStatus: isActive,
                    action: isActive ? "activated" : "deactivated",
                },
            };

            // Add optional properties only if they exist
            if (req.ip) {
                auditData.ipAddress = req.ip;
            }

            const userAgent = req.get("User-Agent");
            if (userAgent) {
                auditData.userAgent = userAgent;
            }
            await auditRepo.create(auditData);

            logger.info(
                `Admin user ${isActive ? "activated" : "deactivated"}: ${
                    targetAdminUser.email
                }`,
                {
                    targetUserId: userId,
                    adminUserId,
                    newStatus: isActive,
                }
            );

            res.json({
                success: true,
                message: `User ${
                    isActive ? "activated" : "deactivated"
                } successfully`,
                data: {
                    userId,
                    isActive,
                },
            });
        } catch (error) {
            logger.error("Update user status error:", error);
            throw error;
        }
    })
);

// Get system settings and configuration
router.get(
    "/settings",
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        try {
            // System information
            const systemSettings = {
                application: {
                    name:
                        process.env.APP_NAME || "Medical Reimbursement System",
                    version: process.env.APP_VERSION || "1.0.0",
                    environment: process.env.NODE_ENV || "development",
                },
                database: {
                    type: process.env.DATABASE_TYPE || "mock",
                    connected: true, // You could check actual connection status
                },
                security: {
                    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
                    rateLimitWindowMs:
                        process.env.RATE_LIMIT_WINDOW_MS || "900000",
                    rateLimitMax: process.env.RATE_LIMIT_MAX || "100",
                },
                features: {
                    fileUploadEnabled: true,
                    emailNotificationsEnabled: !!process.env.SMTP_HOST,
                    auditLoggingEnabled: true,
                },
                server: {
                    port: process.env.PORT || 3001,
                    cors: {
                        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(
                            ","
                        ) || ["http://localhost:5173"],
                    },
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    nodeVersion: process.version,
                },
            };

            res.json({
                success: true,
                data: systemSettings,
                message: "System settings retrieved successfully",
            });
        } catch (error) {
            logger.error("System settings error:", error);
            throw error;
        }
    })
);

// Get audit logs (super admin only)
router.get(
    "/audit-logs",
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        // Check if user is super admin
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (req.user.role !== "super_admin") {
            res.status(403).json({
                success: false,
                message: "Super admin privileges required",
            });
            return;
        }

        const {
            entityType,
            entityId,
            userId,
            page = 1,
            limit = 50,
            startDate,
            endDate,
        } = req.query;

        try {
            const db = await getDatabase();
            const auditRepo = db.getAuditLogRepository();

            let logs;

            if (startDate && endDate) {
                logs = await auditRepo.findByDateRange(
                    new Date(startDate as string),
                    new Date(endDate as string)
                );
            } else if (entityId && entityType) {
                logs = await auditRepo.findByEntityId(
                    entityType as any,
                    entityId as string
                );
            } else if (userId) {
                // Since findByUserId was removed, get all logs and filter by entityId if it matches a user
                logs = await auditRepo.findAll({
                    entityType: "user",
                    entityId: userId as string,
                });
            } else {
                logs = await auditRepo.findAll();
            }

            // Pagination
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedLogs = logs.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    logs: paginatedLogs,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: logs.length,
                        totalPages: Math.ceil(logs.length / Number(limit)),
                    },
                    filters: {
                        entityType,
                        entityId,
                        userId,
                        startDate,
                        endDate,
                    },
                },
                message: "Audit logs retrieved successfully",
            });
        } catch (error) {
            logger.error("Audit logs error:", error);
            throw error;
        }
    })
);

// Export application data (super admin only)
router.get(
    "/export/applications",
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        // Check if user is super admin
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (req.user.role !== "super_admin") {
            res.status(403).json({
                success: false,
                message: "Super admin privileges required",
            });
            return;
        }

        const { format = "json", startDate, endDate, status } = req.query;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();

            let applications = await applicationRepo.findAll();

            // Apply filters
            if (status) {
                applications = applications.filter(
                    (app) => app.status === status
                );
            }

            if (startDate && endDate) {
                const start = new Date(startDate as string);
                const end = new Date(endDate as string);
                applications = applications.filter(
                    (app) => app.submittedAt >= start && app.submittedAt <= end
                );
            }

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "application",
                entityId: "export",
                action: "view",
                changes: {
                    exportType: "applications",
                    format,
                    recordsCount: applications.length,
                    filters: { status, startDate, endDate },
                },
            };

            // Add optional properties only if they exist
            if (req.ip) {
                auditData.ipAddress = req.ip;
            }

            const userAgent = req.get("User-Agent");
            if (userAgent) {
                auditData.userAgent = userAgent;
            }

            await db.getAuditLogRepository().create(auditData);

            logger.info("Application data exported", {
                userId: req.user.userId,
                format,
                recordsCount: applications.length,
            });

            if (format === "csv") {
                // Convert to CSV format
                const csvHeaders =
                    "Application Number,Status,Employee Name,Employee ID,Department,Submitted Date,Total Claimed,Total Passed";
                const csvRows = applications.map(
                    (app) =>
                        `"${app.applicationNumber}","${app.status}","${app.employeeName}","${app.employeeId}","${app.department}","${app.submittedAt}","${app.totalAmountClaimed}","${app.totalAmountPassed}"`
                );
                const csvContent = [csvHeaders, ...csvRows].join("\n");

                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="applications-${
                        new Date().toISOString().split("T")[0]
                    }.csv"`
                );
                res.send(csvContent);
            } else {
                // Return JSON format
                res.json({
                    success: true,
                    data: {
                        applications,
                        meta: {
                            totalRecords: applications.length,
                            exportedAt: new Date().toISOString(),
                            filters: { status, startDate, endDate },
                        },
                    },
                    message: "Application data exported successfully",
                });
            }
        } catch (error) {
            logger.error("Export applications error:", error);
            throw error;
        }
    })
);

export default router;
