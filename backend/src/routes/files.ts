import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/errorHandler";
import { getDatabase } from "../database/connection";
import { logger } from "../utils/logger";
import {
    CreateApplicationDocumentData,
    CreateAuditLogData,
} from "../types/database";

const router = express.Router();

// Authentication middleware
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const applicationId = req.body.applicationId || "temp";
        const applicationDir = path.join(uploadsDir, applicationId);

        // Create application-specific directory
        if (!fs.existsSync(applicationDir)) {
            fs.mkdirSync(applicationDir, { recursive: true });
        }

        cb(null, applicationDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}-${uniqueSuffix}${ext}`);
    },
});

// File filter for security
const fileFilter = (req: any, file: any, cb: any) => {
    const allowedMimes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".doc",
        ".docx",
    ];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (
        allowedMimes.includes(file.mimetype) &&
        allowedExtensions.includes(fileExtension)
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Invalid file type. Only PDF, images, and Word documents are allowed."
            ),
            false
        );
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10, // Maximum 10 files at once
    },
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload files for an application
 *     description: Upload multiple files (receipts, prescriptions, etc.) for a medical reimbursement application
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - documentType
 *               - files
 *             properties:
 *               applicationId:
 *                 type: string
 *                 description: ID of the application to upload files for
 *               documentType:
 *                 type: string
 *                 enum: [prescription, receipt, report, discharge_summary, other]
 *                 description: Type of document being uploaded
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 10 files, 10MB each)
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Files uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedFiles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Document'
 *       400:
 *         description: Invalid input data or file validation error
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
 *       413:
 *         description: File too large
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
// File upload endpoint
router.post(
    "/upload",
    upload.array("files", 10),
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId, documentType } = req.body;
        const files = req.files as Express.Multer.File[];

        // Generate anonymous user ID for file tracking
        const anonymousUserId = `anonymous-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

        if (!files || files.length === 0) {
            res.status(400).json({
                success: false,
                message: "No files uploaded",
            });
            return;
        }

        if (!applicationId) {
            res.status(400).json({
                success: false,
                message: "Application ID is required",
            });
            return;
        }

        try {
            const db = await getDatabase();
            const documentRepo = db.getApplicationDocumentRepository();
            const applicationRepo = db.getMedicalApplicationRepository();
            const auditRepo = db.getAuditLogRepository();

            // Verify application exists
            const application = await applicationRepo.findById(applicationId);
            if (!application) {
                // Clean up uploaded files
                files.forEach((file) => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });

                res.status(404).json({
                    success: false,
                    message: "Application not found",
                });
                return;
            }

            // Save file information to database
            const uploadedFiles = [];
            for (const file of files) {
                const documentData: CreateApplicationDocumentData = {
                    applicationId: applicationId,
                    fileName: file.filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    fileSize: file.size,
                    filePath: file.path,
                    documentType: documentType || "other",
                };

                const document = await documentRepo.create(documentData);
                uploadedFiles.push({
                    id: document.id,
                    fileName: document.fileName,
                    originalName: document.originalName,
                    mimeType: document.mimeType,
                    fileSize: document.fileSize,
                    documentType: document.documentType,
                    uploadedAt: document.uploadedAt,
                });
            }

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "document",
                entityId: applicationId,
                action: "create",
                changes: {
                    filesUploaded: files.length,
                    documentType: documentType,
                    fileNames: files.map((f) => f.originalname),
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
                `Files uploaded for application: ${application.applicationNumber}`,
                {
                    applicationId,
                    anonymousUserId,
                    filesCount: files.length,
                    fileNames: files.map((f) => f.originalname),
                }
            );

            res.status(201).json({
                success: true,
                message: `${files.length} file(s) uploaded successfully`,
                data: {
                    files: uploadedFiles,
                },
            });
        } catch (error) {
            // Clean up uploaded files on error
            if (files) {
                files.forEach((file) => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }

            logger.error("File upload error:", error);
            throw error;
        }
    })
);

// Get file by ID (anonymous access)
router.get(
    "/:id",
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
                message: "Document ID is required",
            });
            return;
        }

        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const documentRepo = db.getApplicationDocumentRepository();
            const applicationRepo = db.getMedicalApplicationRepository();
            const userRepo = db.getUserRepository();

            // Get document
            const document = await documentRepo.findById(id);
            if (!document) {
                res.status(404).json({
                    success: false,
                    message: "File not found",
                });
                return;
            }

            // Check if file exists on disk
            if (!fs.existsSync(document.filePath)) {
                res.status(404).json({
                    success: false,
                    message: "File not found on disk",
                });
                return;
            }

            // Set appropriate headers
            res.setHeader("Content-Type", document.mimeType);
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${document.originalName}"`
            );
            res.setHeader("Content-Length", document.fileSize.toString());

            // Stream file
            const fileStream = fs.createReadStream(document.filePath);
            fileStream.pipe(res);

            logger.info(`File downloaded: ${document.originalName}`, {
                documentId: id,
                applicationId: document.applicationId,
            });
        } catch (error) {
            logger.error("File download error:", error);
            throw error;
        }
    })
);

// Delete file
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
                message: "Document ID is required",
            });
            return;
        }

        const userId = req.user.userId;

        try {
            const db = await getDatabase();
            const documentRepo = db.getApplicationDocumentRepository();
            const applicationRepo = db.getMedicalApplicationRepository();
            const userRepo = db.getUserRepository();
            const auditRepo = db.getAuditLogRepository();

            // Get document
            const document = await documentRepo.findById(id);
            if (!document) {
                res.status(404).json({
                    success: false,
                    message: "File not found",
                });
                return;
            }

            // Get associated application
            const application = await applicationRepo.findById(
                document.applicationId
            );
            if (!application) {
                res.status(404).json({
                    success: false,
                    message: "Associated application not found",
                });
                return;
            }

            // Check user access
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
                (application.employeeId === user.employeeId ||
                    application.employeeId === user.id) &&
                application.status === "pending";

            if (!isAdmin && !isOwner) {
                res.status(403).json({
                    success: false,
                    message:
                        "Access denied. You can only delete files from your own pending applications.",
                });
                return;
            }

            // Delete file from disk
            if (fs.existsSync(document.filePath)) {
                fs.unlinkSync(document.filePath);
            }

            // Delete from database
            const deleted = await documentRepo.delete(id);
            if (!deleted) {
                res.status(500).json({
                    success: false,
                    message: "Failed to delete file record",
                });
                return;
            }

            // Create audit log
            const auditData: CreateAuditLogData = {
                entityType: "document",
                entityId: document.applicationId,
                action: "delete",
                changes: {
                    fileName: document.originalName,
                    documentType: document.documentType,
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

            logger.info(`File deleted: ${document.originalName}`, {
                documentId: id,
                applicationId: document.applicationId,
                userId,
            });

            res.json({
                success: true,
                message: "File deleted successfully",
            });
        } catch (error) {
            logger.error("File deletion error:", error);
            throw error;
        }
    })
);

// Get files for an application
// Get files by application ID (anonymous access)
router.get(
    "/application/:applicationId",
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = req.params;
        const { documentType } = req.query;

        if (!applicationId) {
            res.status(400).json({
                success: false,
                message: "Application ID is required",
            });
            return;
        }

        try {
            const db = await getDatabase();
            const documentRepo = db.getApplicationDocumentRepository();

            // Get documents
            let documents;
            if (documentType) {
                documents = await documentRepo.findByDocumentType(
                    applicationId,
                    documentType as any
                );
            } else {
                documents = await documentRepo.findByApplicationId(
                    applicationId
                );
            }

            // Format response (exclude file paths for security)
            const formattedDocuments = documents.map((doc) => ({
                id: doc.id,
                fileName: doc.fileName,
                originalName: doc.originalName,
                mimeType: doc.mimeType,
                fileSize: doc.fileSize,
                documentType: doc.documentType,
                uploadedAt: doc.uploadedAt,
            }));

            res.json({
                success: true,
                data: {
                    documents: formattedDocuments,
                },
                message: "Files retrieved successfully",
            });
        } catch (error) {
            logger.error("Get application files error:", error);
            throw error;
        }
    })
);

// Error handling for multer
router.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({
                success: false,
                message: "File too large. Maximum size is 10MB.",
            });
            return;
        }
        if (error.code === "LIMIT_FILE_COUNT") {
            res.status(400).json({
                success: false,
                message: "Too many files. Maximum 10 files allowed.",
            });
            return;
        }
        res.status(400).json({
            success: false,
            message: `Upload error: ${error.message}`,
        });
    }

    if (error.message.includes("Invalid file type")) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
        return;
    }

    next(error);
});

export default router;
