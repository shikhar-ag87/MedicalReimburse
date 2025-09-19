import express from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "@/middleware/errorHandler";
import { getDatabase } from "@/database/connection";
import { logger } from "@/utils/logger";
import {
    CreateMedicalApplicationData,
    CreateExpenseItemData,
    CreateAuditLogData,
} from "@/types/database";

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

// Generate application number
const generateApplicationNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `MR-${year}-${randomNum}`;
};

// Submit new medical reimbursement application
router.post(
    "/",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const formData = req.body;
        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const expenseRepo = db.getExpenseItemRepository();
            const auditRepo = db.getAuditLogRepository();

            // Extract expenses from form data
            const { expenses, ...applicationData } = formData;

            // Prepare application data
            const applicationPayload: CreateMedicalApplicationData = {
                applicationNumber: generateApplicationNumber(),
                status: "pending",
                employeeName: applicationData.employeeName,
                employeeId: applicationData.employeeId,
                designation: applicationData.designation,
                department: applicationData.department,
                cghsCardNumber: applicationData.cghsCardNumber,
                cghsDispensary: applicationData.cghsDispensary,
                cardValidity: new Date(applicationData.cardValidity),
                wardEntitlement: applicationData.wardEntitlement,
                patientName: applicationData.patientName,
                patientCghsCard: applicationData.patientCghsCard,
                relationshipWithEmployee:
                    applicationData.relationshipWithEmployee,
                hospitalName: applicationData.hospitalName,
                hospitalAddress: applicationData.hospitalAddress,
                treatmentType: applicationData.treatmentType,
                clothesProvided: applicationData.clothesProvided || false,
                priorPermission: applicationData.priorPermission || false,
                permissionDetails: applicationData.permissionDetails,
                emergencyTreatment: applicationData.emergencyTreatment || false,
                emergencyDetails: applicationData.emergencyDetails,
                healthInsurance: applicationData.healthInsurance || false,
                insuranceAmount: applicationData.insuranceAmount,
                totalAmountClaimed: applicationData.totalAmountClaimed || 0,
                totalAmountPassed: 0, // Will be updated by admin
                bankName: applicationData.bankName,
                branchAddress: applicationData.branchAddress,
                accountNumber: applicationData.accountNumber,
                ifscCode: applicationData.ifscCode,
                enclosuresCount: applicationData.enclosuresCount || 0,
                photocopyCGHSCard: applicationData.photocopyCGHSCard || false,
                photocopiesOriginalPrescriptions:
                    applicationData.photocopiesOriginalPrescriptions || false,
                originalBills: applicationData.originalBills || false,
                signature: applicationData.signature,
                declarationPlace: applicationData.declarationPlace,
                declarationDate: new Date(applicationData.declarationDate),
                facultyEmployeeId: applicationData.facultyEmployeeId,
                mobileNumber: applicationData.mobileNumber,
                email: applicationData.email,
            };

            // Create application
            const newApplication = await applicationRepo.create(
                applicationPayload
            );

            // Create expense items if provided
            if (expenses && Array.isArray(expenses)) {
                for (const expense of expenses) {
                    const expenseData: CreateExpenseItemData = {
                        applicationId: newApplication.id,
                        billNumber: expense.billNumber,
                        billDate: new Date(expense.billDate),
                        description: expense.description,
                        amountClaimed: expense.amountClaimed,
                        amountPassed: 0, // Will be updated by admin
                    };
                    await expenseRepo.create(expenseData);
                }
            }

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "application",
                entityId: newApplication.id,
                action: "create",
                userId: userId,
                userEmail: req.user.email,
                changes: { status: "pending" },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent"),
            };
            await auditRepo.create(auditData);

            logger.info(
                `New application submitted: ${newApplication.applicationNumber}`,
                {
                    applicationId: newApplication.id,
                    userId: userId,
                    totalAmount: applicationData.totalAmountClaimed,
                }
            );

            res.status(201).json({
                success: true,
                message: "Application submitted successfully",
                data: {
                    applicationId: newApplication.id,
                    applicationNumber: newApplication.applicationNumber,
                    status: newApplication.status,
                    submittedAt: newApplication.submittedAt,
                },
            });
        } catch (error) {
            logger.error("Application submission error:", error);
            throw error;
        }
    })
);

// Get all applications for current user
router.get(
    "/",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.userId;
        const { status, page = 1, limit = 10 } = req.query;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const userRepo = db.getUserRepository();

            // Get user details
            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            let applications;
            if (
                user.role === "admin" ||
                user.role === "super_admin" ||
                user.role === "medical_officer"
            ) {
                // Admin can see all applications
                if (status) {
                    applications = await applicationRepo.findByStatus(
                        status as any
                    );
                } else {
                    applications = await applicationRepo.findAll();
                }
            } else {
                // Regular users can only see their own applications
                applications = await applicationRepo.findByEmployeeId(
                    user.employeeId || user.id
                );
                if (status) {
                    applications = applications.filter(
                        (app) => app.status === status
                    );
                }
            }

            // Simple pagination
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedApplications = applications.slice(
                startIndex,
                endIndex
            );

            res.json({
                success: true,
                data: {
                    applications: paginatedApplications,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: applications.length,
                        totalPages: Math.ceil(
                            applications.length / Number(limit)
                        ),
                    },
                },
                message: "Applications retrieved successfully",
            });
        } catch (error) {
            logger.error("Get applications error:", error);
            throw error;
        }
    })
);

// Get specific application by ID
router.get(
    "/:id",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const expenseRepo = db.getExpenseItemRepository();
            const documentRepo = db.getApplicationDocumentRepository();
            const userRepo = db.getUserRepository();

            // Get application
            const application = await applicationRepo.findById(id);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
            }

            // Check if user has access to this application
            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            const isAdmin = [
                "admin",
                "super_admin",
                "medical_officer",
            ].includes(user.role);
            const isOwner =
                application.employeeId === user.employeeId ||
                application.employeeId === user.id;

            if (!isAdmin && !isOwner) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            // Get related data
            const expenses = await expenseRepo.findByApplicationId(id);
            const documents = await documentRepo.findByApplicationId(id);

            res.json({
                success: true,
                data: {
                    application,
                    expenses,
                    documents,
                },
                message: "Application details retrieved successfully",
            });
        } catch (error) {
            logger.error("Get application error:", error);
            throw error;
        }
    })
);

// Update application status (admin only)
router.patch(
    "/:id/status",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, comments, amountPassed } = req.body;
        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const userRepo = db.getUserRepository();
            const auditRepo = db.getAuditLogRepository();

            // Check if user is admin
            const user = await userRepo.findById(userId);
            if (
                !user ||
                !["admin", "super_admin", "medical_officer"].includes(user.role)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Admin privileges required.",
                });
            }

            // Get current application
            const application = await applicationRepo.findById(id);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
            }

            // Update application status
            const updatedApplication = await applicationRepo.updateStatus(
                id,
                status,
                userId,
                comments
            );

            // If amount passed is provided, update it
            if (amountPassed !== undefined && updatedApplication) {
                await applicationRepo.update(id, {
                    totalAmountPassed: amountPassed,
                });
            }

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "application",
                entityId: id,
                action: "update",
                userId: userId,
                userEmail: user.email,
                changes: {
                    oldStatus: application.status,
                    newStatus: status,
                    comments,
                    amountPassed,
                },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent"),
            };
            await auditRepo.create(auditData);

            logger.info(
                `Application status updated: ${application.applicationNumber}`,
                {
                    applicationId: id,
                    oldStatus: application.status,
                    newStatus: status,
                    updatedBy: userId,
                }
            );

            res.json({
                success: true,
                message: `Application status updated to ${status}`,
                data: { status, comments, amountPassed },
            });
        } catch (error) {
            logger.error("Update application status error:", error);
            throw error;
        }
    })
);

// Delete application (admin only, or owner if still pending)
router.delete(
    "/:id",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const userRepo = db.getUserRepository();
            const auditRepo = db.getAuditLogRepository();

            // Get application
            const application = await applicationRepo.findById(id);
            if (!application) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
            }

            // Check permissions
            const user = await userRepo.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            const isAdmin = ["admin", "super_admin"].includes(user.role);
            const isOwner =
                application.employeeId === user.employeeId ||
                application.employeeId === user.id;
            const isPending = application.status === "pending";

            if (!isAdmin && !(isOwner && isPending)) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Access denied. You can only delete your own pending applications.",
                });
            }

            // Delete application
            const deleted = await applicationRepo.delete(id);
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete application",
                });
            }

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "application",
                entityId: id,
                action: "delete",
                userId: userId,
                userEmail: user.email,
                changes: {
                    applicationNumber: application.applicationNumber,
                    status: application.status,
                },
                ipAddress: req.ip,
                userAgent: req.get("User-Agent"),
            };
            await auditRepo.create(auditData);

            logger.info(
                `Application deleted: ${application.applicationNumber}`,
                {
                    applicationId: id,
                    deletedBy: userId,
                }
            );

            res.json({
                success: true,
                message: "Application deleted successfully",
            });
        } catch (error) {
            logger.error("Delete application error:", error);
            throw error;
        }
    })
);

// Get application statistics (admin only)
router.get(
    "/stats/overview",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const userRepo = db.getUserRepository();

            // Check if user is admin
            const user = await userRepo.findById(userId);
            if (
                !user ||
                !["admin", "super_admin", "medical_officer"].includes(user.role)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Admin privileges required.",
                });
            }

            // Get application statistics
            const stats = await applicationRepo.getApplicationStats();

            res.json({
                success: true,
                data: stats,
                message: "Application statistics retrieved successfully",
            });
        } catch (error) {
            logger.error("Get application stats error:", error);
            throw error;
        }
    })
);

export default router;
