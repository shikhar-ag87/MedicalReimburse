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
                    required: ["username", "email", "role", "fullName"],
                    properties: {
                        id: {
                            type: "string",
                            description: "Unique identifier for the user",
                            example: "uuid-123",
                        },
                        username: {
                            type: "string",
                            description: "Username for login",
                            example: "john.doe",
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
                                "health_centre",
                                "obc",
                                "super_admin",
                            ],
                            description: "User role in the system",
                        },
                        fullName: {
                            type: "string",
                            description: "Full name of the user",
                            example: "John Doe",
                        },
                        employeeId: {
                            type: "string",
                            description: "Employee ID",
                            example: "EMP001",
                        },
                        department: {
                            type: "string",
                            description: "Department name",
                            example: "Computer Science",
                        },
                        designation: {
                            type: "string",
                            description: "Job designation",
                            example: "Assistant Professor",
                        },
                        phoneNumber: {
                            type: "string",
                            description: "Contact phone number",
                            example: "+91-9999999999",
                        },
                        address: {
                            type: "string",
                            description: "Home address",
                        },
                        emergencyContact: {
                            type: "string",
                            description: "Emergency contact details",
                        },
                        isActive: {
                            type: "boolean",
                            description: "Whether the user account is active",
                            default: true,
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
                        "patientName",
                        "relation",
                        "treatmentType",
                        "hospitalName",
                        "totalAmount",
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
                                "draft",
                                "submitted",
                                "under_review",
                                "approved",
                                "rejected",
                                "clarification_required",
                            ],
                            description: "Current status of the application",
                        },
                        patientName: {
                            type: "string",
                            description: "Name of the patient",
                            example: "John Doe",
                        },
                        relation: {
                            type: "string",
                            enum: [
                                "self",
                                "spouse",
                                "child",
                                "parent",
                                "dependent",
                            ],
                            description: "Relationship to the employee",
                        },
                        age: {
                            type: "number",
                            description: "Age of the patient",
                            example: 35,
                        },
                        gender: {
                            type: "string",
                            enum: ["male", "female", "other"],
                            description: "Gender of the patient",
                        },
                        treatmentType: {
                            type: "string",
                            enum: [
                                "outpatient",
                                "inpatient",
                                "emergency",
                                "specialty",
                                "diagnostic",
                                "preventive",
                                "dental",
                                "eye_care",
                                "maternity",
                                "surgery",
                            ],
                            description: "Type of medical treatment",
                        },
                        hospitalName: {
                            type: "string",
                            description: "Name of the hospital/clinic",
                            example: "AIIMS Delhi",
                        },
                        doctorName: {
                            type: "string",
                            description: "Name of the attending doctor",
                            example: "Dr. Smith",
                        },
                        treatmentDate: {
                            type: "string",
                            format: "date",
                            description: "Date of treatment",
                        },
                        diagnosis: {
                            type: "string",
                            description: "Medical diagnosis",
                        },
                        totalAmount: {
                            type: "number",
                            description: "Total amount for reimbursement",
                            example: 5000.0,
                        },
                        expenseItems: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    category: {
                                        type: "string",
                                        enum: [
                                            "consultation",
                                            "medicines",
                                            "lab_tests",
                                            "surgery",
                                            "hospitalization",
                                            "other",
                                        ],
                                    },
                                    description: {
                                        type: "string",
                                    },
                                    amount: {
                                        type: "number",
                                    },
                                    billNumber: {
                                        type: "string",
                                    },
                                    billDate: {
                                        type: "string",
                                        format: "date",
                                    },
                                },
                            },
                        },
                        submittedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Submission timestamp",
                        },
                        reviewedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Review timestamp",
                        },
                        reviewedBy: {
                            type: "string",
                            description: "ID of the reviewer",
                        },
                        comments: {
                            type: "string",
                            description: "Review comments",
                        },
                        approvedAmount: {
                            type: "number",
                            description: "Approved amount for reimbursement",
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
                                "cghs_card",
                                "prescription",
                                "bill",
                                "receipt",
                                "medical_certificate",
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
                        uploadedBy: {
                            type: "string",
                            description: "ID of the user who uploaded the file",
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
                            description: "ID of the associated application",
                        },
                        description: {
                            type: "string",
                            description: "Description of the expense",
                            example: "Consultation fee",
                        },
                        amount: {
                            type: "number",
                            format: "float",
                            description: "Amount of the expense",
                            example: 1500.5,
                        },
                        category: {
                            type: "string",
                            enum: [
                                "consultation",
                                "medicines",
                                "lab_tests",
                                "surgery",
                                "hospitalization",
                                "other",
                            ],
                            description: "Category of the expense",
                        },
                        billNumber: {
                            type: "string",
                            description: "Bill/receipt number",
                            example: "BILL001",
                        },
                        billDate: {
                            type: "string",
                            format: "date",
                            description: "Date of the bill",
                        },
                        isApproved: {
                            type: "boolean",
                            description:
                                "Whether this expense item is approved",
                            default: false,
                        },
                        approvedAmount: {
                            type: "number",
                            format: "float",
                            description:
                                "Approved amount for this expense item",
                        },
                        remarks: {
                            type: "string",
                            description:
                                "Reviewer remarks for this expense item",
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
