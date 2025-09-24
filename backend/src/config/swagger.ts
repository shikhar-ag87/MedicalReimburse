import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "JNU Medical Reimbursement API",
            version: "1.0.0",
            description:
                "API documentation for the JNU Medical Reimbursement System",
            contact: {
                name: "API Support",
                email: "support@jnu.ac.in",
            },
            license: {
                name: "MIT",
                url: "https://opensource.org/licenses/MIT",
            },
        },
        servers: [
            {
                url: "http://localhost:3001/api",
                description: "Development server",
            },
            {
                url: "https://api.jnu.ac.in/medical-reimbursement",
                description: "Production server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT token for authentication",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    required: ["email", "role", "name"],
                    properties: {
                        id: {
                            type: "string",
                            description: "Unique identifier for the user",
                            example: "uuid-123",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                            example: "john.doe@jnu.ac.in",
                        },
                        role: {
                            type: "string",
                            enum: [
                                "employee",
                                "admin",
                                "super_admin",
                                "medical_officer",
                            ],
                            description: "User role in the system",
                        },
                        name: {
                            type: "string",
                            description: "Full name of the user",
                            example: "John Doe",
                        },
                        employeeId: {
                            type: "string",
                            description: "Employee ID (optional)",
                            example: "EMP001",
                        },
                        department: {
                            type: "string",
                            description: "Department name (optional)",
                            example: "Computer Science",
                        },
                        designation: {
                            type: "string",
                            description: "Job designation (optional)",
                            example: "Assistant Professor",
                        },
                        isActive: {
                            type: "boolean",
                            description: "Whether the user account is active",
                            example: true,
                        },
                        lastLogin: {
                            type: "string",
                            format: "date-time",
                            description: "Last login timestamp",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Account creation timestamp",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                    },
                },
                Application: {
                    type: "object",
                    required: [
                        "employeeName",
                        "employeeId",
                        "patientName",
                        "hospitalName",
                        "totalAmountClaimed",
                    ],
                    properties: {
                        id: {
                            type: "string",
                            description:
                                "Unique identifier for the application",
                        },
                        applicationNumber: {
                            type: "string",
                            description: "System-generated application number",
                            example: "MR2025001",
                        },
                        status: {
                            type: "string",
                            enum: [
                                "pending",
                                "under_review",
                                "approved",
                                "rejected",
                                "completed",
                            ],
                            description: "Current status of the application",
                        },
                        submittedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Application submission timestamp",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                        // Employee details
                        employeeName: {
                            type: "string",
                            description: "Name of the employee",
                            example: "John Doe",
                        },
                        employeeId: {
                            type: "string",
                            description: "Employee ID",
                            example: "EMP001",
                        },
                        designation: {
                            type: "string",
                            description: "Employee designation",
                            example: "Assistant Professor",
                        },
                        department: {
                            type: "string",
                            description: "Employee department",
                            example: "Computer Science",
                        },
                        cghsCardNumber: {
                            type: "string",
                            description: "CGHS card number",
                            example: "1234567890",
                        },
                        cghsDispensary: {
                            type: "string",
                            description: "CGHS dispensary name",
                            example: "JNU CGHS",
                        },
                        cardValidity: {
                            type: "string",
                            format: "date",
                            description: "CGHS card validity date",
                        },
                        wardEntitlement: {
                            type: "string",
                            description: "Ward entitlement",
                            example: "General",
                        },
                        // Patient details
                        patientName: {
                            type: "string",
                            description: "Name of the patient",
                            example: "John Doe",
                        },
                        patientCghsCard: {
                            type: "string",
                            description: "Patient CGHS card number",
                            example: "1234567890",
                        },
                        relationshipWithEmployee: {
                            type: "string",
                            description: "Relationship with employee",
                            example: "self",
                        },
                        // Treatment details
                        hospitalName: {
                            type: "string",
                            description: "Name of the hospital/clinic",
                            example: "AIIMS Delhi",
                        },
                        hospitalAddress: {
                            type: "string",
                            description: "Hospital address",
                            example: "Ansari Nagar, New Delhi",
                        },
                        treatmentType: {
                            type: "string",
                            enum: ["opd", "inpatient", "emergency"],
                            description: "Type of medical treatment",
                        },
                        clothesProvided: {
                            type: "boolean",
                            description: "Whether clothes were provided",
                            default: false,
                        },
                        priorPermission: {
                            type: "boolean",
                            description: "Whether prior permission was taken",
                            default: false,
                        },
                        emergencyTreatment: {
                            type: "boolean",
                            description: "Whether it was emergency treatment",
                            default: false,
                        },
                        healthInsurance: {
                            type: "boolean",
                            description: "Whether health insurance was used",
                            default: false,
                        },
                        // Financial details
                        totalAmountClaimed: {
                            type: "number",
                            format: "float",
                            description: "Total amount claimed",
                            example: 5000.0,
                        },
                        totalAmountPassed: {
                            type: "number",
                            format: "float",
                            description:
                                "Total amount passed for reimbursement",
                            example: 4500.0,
                        },
                        // Bank details
                        bankName: {
                            type: "string",
                            description: "Bank name",
                            example: "State Bank of India",
                        },
                        branchAddress: {
                            type: "string",
                            description: "Bank branch address",
                            example: "JNU Branch, New Delhi",
                        },
                        accountNumber: {
                            type: "string",
                            description: "Bank account number",
                            example: "123456789012",
                        },
                        ifscCode: {
                            type: "string",
                            description: "Bank IFSC code",
                            example: "SBIN0001234",
                        },
                        // Documents
                        enclosuresCount: {
                            type: "number",
                            description: "Number of enclosures",
                            example: 3,
                        },
                        photocopyCGHSCard: {
                            type: "boolean",
                            description: "CGHS card photocopy attached",
                            default: false,
                        },
                        photocopiesOriginalPrescriptions: {
                            type: "boolean",
                            description:
                                "Original prescription photocopies attached",
                            default: false,
                        },
                        originalBills: {
                            type: "boolean",
                            description: "Original bills attached",
                            default: false,
                        },
                        // Declaration
                        signature: {
                            type: "string",
                            description: "Employee signature",
                            example: "John Doe",
                        },
                        declarationPlace: {
                            type: "string",
                            description: "Place of declaration",
                            example: "New Delhi",
                        },
                        declarationDate: {
                            type: "string",
                            format: "date",
                            description: "Date of declaration",
                        },
                        facultyEmployeeId: {
                            type: "string",
                            description: "Faculty employee ID",
                            example: "EMP001",
                        },
                        mobileNumber: {
                            type: "string",
                            description: "Mobile number",
                            example: "+91-9999999999",
                        },
                    },
                },
                ExpenseItem: {
                    type: "object",
                    required: ["description", "amount", "category"],
                    properties: {
                        id: {
                            type: "string",
                            description:
                                "Unique identifier for the expense item",
                        },
                        applicationId: {
                            type: "string",
                            description: "Associated application ID",
                        },
                        description: {
                            type: "string",
                            description: "Description of the expense",
                            example: "Doctor consultation fee",
                        },
                        amount: {
                            type: "number",
                            format: "float",
                            description: "Expense amount",
                            example: 500.0,
                        },
                        category: {
                            type: "string",
                            description: "Expense category",
                            example: "consultation",
                        },
                        receiptNumber: {
                            type: "string",
                            description: "Receipt number",
                            example: "REC001",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Creation timestamp",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                    },
                },
                Document: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Unique identifier for the document",
                        },
                        fileName: {
                            type: "string",
                            description: "System-generated file name",
                        },
                        originalName: {
                            type: "string",
                            description: "Original file name",
                        },
                        mimeType: {
                            type: "string",
                            description: "MIME type of the file",
                        },
                        fileSize: {
                            type: "number",
                            description: "File size in bytes",
                        },
                        documentType: {
                            type: "string",
                            enum: [
                                "prescription",
                                "receipt",
                                "report",
                                "discharge_summary",
                                "other",
                            ],
                            description: "Type of document",
                        },
                        applicationId: {
                            type: "string",
                            description: "Associated application ID",
                        },
                        uploadedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Upload timestamp",
                        },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["username", "password"],
                    properties: {
                        username: {
                            type: "string",
                            description: "Username or email",
                            example: "john.doe",
                        },
                        password: {
                            type: "string",
                            description: "User password",
                            example: "SecurePassword123!",
                        },
                    },
                },
                RegisterRequest: {
                    type: "object",
                    required: [
                        "username",
                        "email",
                        "password",
                        "fullName",
                        "role",
                    ],
                    properties: {
                        username: {
                            type: "string",
                            description: "Unique username",
                            example: "john.doe",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "Email address",
                            example: "john.doe@jnu.ac.in",
                        },
                        password: {
                            type: "string",
                            description: "Password (min 8 characters)",
                            example: "SecurePassword123!",
                        },
                        fullName: {
                            type: "string",
                            description: "Full name",
                            example: "John Doe",
                        },
                        role: {
                            type: "string",
                            enum: ["employee", "health_centre", "obc"],
                            description:
                                "User role (super_admin can only be set by existing super_admin)",
                        },
                        employeeId: {
                            type: "string",
                            description: "Employee ID",
                            example: "EMP001",
                        },
                        department: {
                            type: "string",
                            description: "Department",
                            example: "Computer Science",
                        },
                        designation: {
                            type: "string",
                            description: "Job designation",
                            example: "Assistant Professor",
                        },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: true,
                        },
                        message: {
                            type: "string",
                            example: "Login successful",
                        },
                        data: {
                            type: "object",
                            properties: {
                                token: {
                                    type: "string",
                                    description: "JWT authentication token",
                                },
                                user: {
                                    $ref: "#/components/schemas/User",
                                },
                            },
                        },
                    },
                },
                ApiResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            description: "Whether the request was successful",
                        },
                        message: {
                            type: "string",
                            description: "Response message",
                        },
                        data: {
                            description: "Response data (varies by endpoint)",
                        },
                        error: {
                            type: "object",
                            description:
                                "Error details (only present when success is false)",
                            properties: {
                                code: {
                                    type: "string",
                                },
                                details: {
                                    type: "string",
                                },
                            },
                        },
                    },
                },
                ValidationError: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        message: {
                            type: "string",
                            example: "Validation failed",
                        },
                        error: {
                            type: "object",
                            properties: {
                                code: {
                                    type: "string",
                                    example: "VALIDATION_ERROR",
                                },
                                details: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            field: {
                                                type: "string",
                                            },
                                            message: {
                                                type: "string",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: true,
                        },
                        message: {
                            type: "string",
                            example: "Operation completed successfully",
                        },
                        data: {
                            type: "object",
                            description:
                                "Response data (structure varies by endpoint)",
                        },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        message: {
                            type: "string",
                            example: "An error occurred",
                        },
                        error: {
                            type: "object",
                            properties: {
                                code: {
                                    type: "string",
                                    example: "ERROR_CODE",
                                },
                                details: {
                                    type: "string",
                                    example: "Detailed error information",
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: "Authentication",
                description: "User authentication and authorization endpoints",
            },
            {
                name: "Applications",
                description: "Medical reimbursement application management",
            },
            {
                name: "Files",
                description: "Document upload and management",
            },
            {
                name: "Users",
                description: "User profile and account management",
            },
            {
                name: "Admin",
                description: "Administrative functions and dashboard",
            },
            {
                name: "Health",
                description: "System health and monitoring",
            },
        ],
    },
    apis: ["./src/routes/*.ts", "./src/server.ts"],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
    app.use(
        "/api/docs",
        swaggerUi.serve,
        swaggerUi.setup(specs, {
            explorer: true,
            customCss: ".swagger-ui .topbar { display: none }",
            customSiteTitle: "JNU Medical Reimbursement API Documentation",
        })
    );

    // Serve OpenAPI spec as JSON
    app.get("/api/docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(specs);
    });
};

export default specs;
