import request from "supertest";
import jwt from "jsonwebtoken";
import { Express } from "express";
import { User } from "../../src/types/database";

export class TestHelpers {
    /**
     * Generate JWT token for testing
     */
    static generateTestToken(user: Partial<User>): string {
        return jwt.sign(
            {
                userId: user.id || "test-user-id",
                email: user.email || "test@example.com",
                role: user.role || "employee",
            },
            process.env.JWT_SECRET || "test-secret-key",
            { expiresIn: "1h" }
        );
    }

    /**
     * Create authenticated request
     */
    static authenticatedRequest(app: Express, user: Partial<User>) {
        const token = this.generateTestToken(user);
        return request(app).set("Authorization", `Bearer ${token}`);
    }

    /**
     * Login helper for integration tests
     */
    static async loginUser(
        app: Express,
        credentials: { email: string; password: string }
    ) {
        const response = await request(app)
            .post("/api/auth/login")
            .send(credentials);

        return response.body.data?.token;
    }

    /**
     * Register user helper
     */
    static async registerUser(app: Express, userData: any) {
        const response = await request(app)
            .post("/api/auth/register")
            .send(userData);

        return response.body.data;
    }

    /**
     * Create application helper
     */
    static async createApplication(
        app: Express,
        token: string,
        applicationData: any
    ) {
        const response = await request(app)
            .post("/api/applications")
            .set("Authorization", `Bearer ${token}`)
            .send(applicationData);

        return response.body.data;
    }

    /**
     * Upload file helper
     */
    static async uploadFile(
        app: Express,
        token: string,
        filePath: string,
        applicationId: string
    ) {
        const response = await request(app)
            .post("/api/files/upload")
            .set("Authorization", `Bearer ${token}`)
            .field("applicationId", applicationId)
            .field("documentType", "other")
            .attach("files", filePath);

        return response.body.data;
    }

    /**
     * Wait for async operations
     */
    static async wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Expect successful response
     */
    static expectSuccess(response: request.Response, statusCode: number = 200) {
        expect(response.status).toBe(statusCode);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBeDefined();
    }

    /**
     * Expect error response
     */
    static expectError(
        response: request.Response,
        statusCode: number,
        message?: string
    ) {
        expect(response.status).toBe(statusCode);
        expect(response.body.success).toBe(false);
        if (message) {
            expect(response.body.message).toContain(message);
        }
    }

    /**
     * Expect validation error
     */
    static expectValidationError(response: request.Response) {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBeDefined();
    }

    /**
     * Expect unauthorized error
     */
    static expectUnauthorized(response: request.Response) {
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    }

    /**
     * Expect forbidden error
     */
    static expectForbidden(response: request.Response) {
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    }

    /**
     * Expect not found error
     */
    static expectNotFound(response: request.Response) {
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    }

    /**
     * Clean string for comparison
     */
    static cleanString(str: string): string {
        return str.replace(/\s+/g, " ").trim();
    }

    /**
     * Deep clean object for comparison
     */
    static cleanObject(obj: any): any {
        if (obj === null || obj === undefined) return obj;

        if (Array.isArray(obj)) {
            return obj.map((item) => this.cleanObject(item));
        }

        if (typeof obj === "object") {
            const cleaned: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cleaned[key] = this.cleanObject(obj[key]);
                }
            }
            return cleaned;
        }

        if (typeof obj === "string") {
            return this.cleanString(obj);
        }

        return obj;
    }

    /**
     * Assert user properties
     */
    static assertUser(user: any, expected: Partial<User>) {
        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.email).toBe(expected.email);
        expect(user.name).toBe(expected.name);
        expect(user.role).toBe(expected.role);
        expect(user.isActive).toBe(expected.isActive ?? true);
        expect(user.createdAt).toBeDefined();
        expect(user.updatedAt).toBeDefined();
    }

    /**
     * Assert application properties
     */
    static assertApplication(application: any, expected: any) {
        expect(application).toBeDefined();
        expect(application.id).toBeDefined();
        expect(application.applicationNumber).toBeDefined();
        expect(application.patientName).toBe(expected.patientName);
        expect(application.totalAmount).toBe(expected.totalAmount);
        expect(application.status).toBeDefined();
        expect(application.createdAt).toBeDefined();
        expect(application.updatedAt).toBeDefined();
    }

    /**
     * Create test file buffer
     */
    static createTestFile(
        content: string = "test file content",
        filename: string = "test.txt"
    ): Buffer {
        return Buffer.from(content);
    }

    /**
     * Mock file upload
     */
    static mockFileUpload(filename: string = "test.pdf", size: number = 1024) {
        return {
            fieldname: "files",
            originalname: filename,
            encoding: "7bit",
            mimetype: "application/pdf",
            buffer: Buffer.alloc(size, "test"),
            size: size,
        };
    }

    /**
     * Generate random email
     */
    static randomEmail(): string {
        return `test${Date.now()}@test.com`;
    }

    /**
     * Generate random string
     */
    static randomString(length: number = 10): string {
        return Math.random()
            .toString(36)
            .substring(2, length + 2);
    }

    /**
     * Environment setup for tests
     */
    static setupTestEnvironment() {
        process.env.NODE_ENV = "test";
        process.env.JWT_SECRET = "test-secret-key";
        process.env.DATABASE_TYPE = "mock";
        process.env.PORT = "3002"; // Different port for tests
    }

    /**
     * Clear test environment
     */
    static clearTestEnvironment() {
        // Clean up any test-specific data
    }
}

export default TestHelpers;
