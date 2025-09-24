import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/errorHandler";
import { getDatabase } from "../database/connection";
import { logger } from "../utils/logger";
import {
    CreateMedicalApplicationData,
    CreateExpenseItemData,
    CreateAuditLogData,
} from "../types/database";

const router = express.Router();

// Authentication middleware (for admin routes only)
const authenticateToken = (
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
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
        return;
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

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Submit new medical reimbursement application
 *     description: Create a new medical reimbursement application with patient details, treatment information, and expense items
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeName
 *               - employeeId
 *               - designation
 *               - department
 *               - cghsCardNumber
 *               - cghsDispensary
 *               - cardValidity
 *               - wardEntitlement
 *               - patientName
 *               - relationship
 *               - patientAge
 *               - gender
 *               - dateOfTreatment
 *               - hospitalName
 *               - hospitalLocation
 *               - treatmentType
 *               - treatmentDescription
 *               - totalAmount
 *               - expenses
 *             properties:
 *               employeeName:
 *                 type: string
 *                 description: Name of the employee
 *               employeeId:
 *                 type: string
 *                 description: Employee ID
 *               designation:
 *                 type: string
 *                 description: Employee designation
 *               department:
 *                 type: string
 *                 description: Employee department
 *               cghsCardNumber:
 *                 type: string
 *                 description: CGHS card number
 *               cghsDispensary:
 *                 type: string
 *                 description: CGHS dispensary
 *               cardValidity:
 *                 type: string
 *                 format: date
 *                 description: CGHS card validity date
 *               wardEntitlement:
 *                 type: string
 *                 description: Ward entitlement
 *               patientName:
 *                 type: string
 *                 description: Name of the patient
 *               relationship:
 *                 type: string
 *                 description: Relationship to employee
 *               patientAge:
 *                 type: integer
 *                 description: Age of the patient
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Patient gender
 *               dateOfTreatment:
 *                 type: string
 *                 format: date
 *                 description: Date of treatment
 *               hospitalName:
 *                 type: string
 *                 description: Name of the hospital
 *               hospitalLocation:
 *                 type: string
 *                 description: Hospital location
 *               treatmentType:
 *                 type: string
 *                 description: Type of treatment
 *               treatmentDescription:
 *                 type: string
 *                 description: Description of treatment
 *               totalAmount:
 *                 type: number
 *                 format: float
 *                 description: Total amount claimed
 *               expenses:
 *                 type: array
 *                 description: List of expense items
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                       description: Expense description
 *                     amount:
 *                       type: number
 *                       format: float
 *                       description: Expense amount
 *                     category:
 *                       type: string
 *                       description: Expense category
 *                     receiptNumber:
 *                       type: string
 *                       description: Receipt number
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Submit new medical reimbursement application
router.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        const formData = req.body;

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
                ...(applicationData.insuranceAmount &&
                    applicationData.insuranceAmount !== "" && {
                        insuranceAmount: parseFloat(
                            applicationData.insuranceAmount
                        ),
                    }),
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
                changes: { status: "pending" },
            };

            // Add optional properties only if they exist
            if (req.ip) {
                auditData.ipAddress = req.ip;
            }

            const userAgent = req.get("User-Agent");
            if (userAgent) {
                auditData.userAgent = userAgent;
            }

            // Note: Audit logging temporarily disabled for anonymous system
            // await auditRepo.create(auditData);

            logger.info(
                `New application submitted: ${newApplication.applicationNumber}`,
                {
                    applicationId: newApplication.id,
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

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications for current user
 *     description: Retrieve a paginated list of medical reimbursement applications for the authenticated user
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, processing]
 *         description: Filter applications by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of applications per page
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     applications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Application'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get all applications (admin only)
router.get(
    "/",
    authenticateToken,
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        const userId = req.user.userId;
        const { status, page = 1, limit = 10 } = req.query;

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
                res.status(403).json({
                    success: false,
                    message: "Access denied. Admin privileges required.",
                });
                return;
            }

            // Get all applications (admin can see all)
            let applications;
            if (status) {
                applications = await applicationRepo.findByStatus(
                    status as any
                );
            } else {
                applications = await applicationRepo.findAll();
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

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get specific application by ID
 *     description: Retrieve detailed information about a specific medical reimbursement application including expenses and documents
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     application:
 *                       $ref: '#/components/schemas/Application'
 *                     expenses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ExpenseItem'
 *                     documents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Document'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Cannot access this application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get specific application by ID
router.get(
    "/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "Application ID is required",
            });
            return;
        }

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const expenseRepo = db.getExpenseItemRepository();
            const documentRepo = db.getApplicationDocumentRepository();

            // Get application
            const application = await applicationRepo.findById(id);
            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
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
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status, comments, amountPassed } = req.body;

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        const userId = req.user.userId;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "Application ID is required",
            });
            return;
        }

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
                res.status(403).json({
                    success: false,
                    message: "Access denied. Admin privileges required.",
                });
                return;
            }

            // Get current application
            const application = await applicationRepo.findById(id);
            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
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
                changes: {
                    oldStatus: application.status,
                    newStatus: status,
                    comments,
                    amountPassed,
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

            // Note: Audit logging temporarily disabled for anonymous system
            // await auditRepo.create(auditData);

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
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        if (!id) {
            res.status(400).json({
                success: false,
                message: "Application ID is required",
            });
            return;
        }

        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const applicationRepo = db.getMedicalApplicationRepository();
            const userRepo = db.getUserRepository();
            const auditRepo = db.getAuditLogRepository();

            // Get application
            const application = await applicationRepo.findById(id);
            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            // Check permissions
            const user = await userRepo.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            const isAdmin = ["admin", "super_admin"].includes(user.role);
            const isOwner =
                application.employeeId === user.employeeId ||
                application.employeeId === user.id;
            const isPending = application.status === "pending";

            if (!isAdmin && !(isOwner && isPending)) {
                res.status(403).json({
                    success: false,
                    message:
                        "Access denied. You can only delete your own pending applications.",
                });
                return;
            }

            // Delete application
            const deleted = await applicationRepo.delete(id);
            if (!deleted) {
                res.status(500).json({
                    success: false,
                    message: "Failed to delete application",
                });
                return;
            }

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "application",
                entityId: id,
                action: "delete",
                changes: {
                    applicationNumber: application.applicationNumber,
                    status: application.status,
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

            // Note: Audit logging temporarily disabled for anonymous system
            // await auditRepo.create(auditData);

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
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

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
                res.status(403).json({
                    success: false,
                    message: "Access denied. Admin privileges required.",
                });
                return;
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
