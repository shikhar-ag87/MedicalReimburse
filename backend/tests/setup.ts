import { beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import { connectDatabase, clearMockData } from "../src/database/connection";

// Global test setup
beforeAll(async () => {
    // Initialize test environment variables
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-secret-key-for-jwt-signing";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.DATABASE_TYPE = "mock";
    process.env.API_KEY = "test-api-key";
    process.env.PORT = "3002"; // Different port for tests

    // File upload settings for testing
    process.env.MAX_FILE_SIZE = "5242880"; // 5MB
    process.env.ALLOWED_FILE_TYPES = "pdf,jpg,jpeg,png,doc,docx";

    // Initialize database connection
    await connectDatabase();

    console.log("Test environment initialized");
});

afterAll(async () => {
    // Cleanup after all tests
    console.log("Test environment cleanup completed");
});

beforeEach(async () => {
    // Setup before each test
    // Note: Don't clear data here as it happens after test setup
});

afterEach(async () => {
    // Cleanup after each test
    // Clear test data to ensure clean state for next test
    clearMockData();
});
