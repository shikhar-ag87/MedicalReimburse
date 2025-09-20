# Testing Guide - JNU Medical Reimbursement System Backend

## Overview

This project uses Jest as the testing framework with TypeScript support. The test suite includes unit tests, integration tests, and API endpoint tests.

## Test Structure

```
tests/
├── setup.ts              # Global test setup and configuration
├── fixtures/
│   └── mockData.ts       # Mock data generators using faker.js
├── helpers/
│   └── testHelpers.ts    # Test utility functions and helpers
└── *.test.ts            # Individual test files
```

## Running Tests

### All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- auth.test.ts
```

### Run Tests in Silent Mode

```bash
npm test -- --silent
```

## Test Configuration

The project is configured with:

-   **Framework**: Jest with ts-jest preset
-   **Test Environment**: Node.js
-   **Mock Database**: In-memory mock for testing
-   **HTTP Testing**: SuperTest for API endpoint testing
-   **Data Generation**: Faker.js for realistic test data

## Test Categories

### 1. Authentication Tests (`auth.test.ts`)

-   User registration
-   Login/logout functionality
-   Token validation
-   Password management
-   Profile management

### 2. Application Tests (Future)

-   Medical application CRUD operations
-   Application status workflows
-   Document management
-   Application approval processes

### 3. File Management Tests (Future)

-   File upload functionality
-   File validation
-   File retrieval
-   File deletion

### 4. Admin Panel Tests (Future)

-   Admin dashboard functionality
-   User management
-   Application review processes
-   System settings

## Mock Data Generation

The `MockDataGenerator` class provides realistic test data:

```typescript
// Generate mock user
const user = MockDataGenerator.generateUser({
    role: "employee",
    department: "Computer Science",
});

// Generate mock application
const application = MockDataGenerator.generateApplication(userId, {
    treatmentType: "outpatient",
    totalAmount: 5000,
});
```

## Test Helpers

The `TestHelpers` class provides utilities for:

-   JWT token generation for authentication testing
-   HTTP request setup with authentication
-   Response validation
-   User registration and login helpers
-   Application creation helpers

## Environment Variables

Tests use these environment variables:

```
NODE_ENV=test
JWT_SECRET=test-secret-key-for-jwt-signing
DATABASE_TYPE=mock
API_KEY=test-api-key
PORT=3002
```

## Writing New Tests

### Basic Test Structure

```typescript
import request from "supertest";
import { createApp } from "../src/app";
import { TestHelpers } from "./helpers/testHelpers";

describe("Feature Name", () => {
    let app: Express;

    beforeAll(async () => {
        app = createApp();
    });

    it("should do something", async () => {
        const response = await request(app).get("/api/endpoint").expect(200);

        expect(response.body).toBeDefined();
    });
});
```

### Authenticated Requests

```typescript
it("should work with authentication", async () => {
    const user = await TestHelpers.registerUser(app, userData);
    const token = TestHelpers.generateTestToken(user);

    const response = await request(app)
        .get("/api/protected-endpoint")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
});
```

### Database Testing

The mock database provides isolated test environments. Each test gets a fresh database state.

## Test Coverage

The test suite covers:

-   ✅ API endpoint functionality
-   ✅ Authentication and authorization
-   ✅ Request validation
-   ✅ Error handling
-   ✅ Database interactions (mocked)
-   ⏳ File upload/download (planned)
-   ⏳ Business logic validation (planned)

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clean Data**: Use fresh mock data for each test
3. **Clear Assertions**: Test specific, expected behaviors
4. **Error Cases**: Test both success and failure scenarios
5. **Realistic Data**: Use faker.js for realistic test data
6. **Authentication**: Test both authenticated and unauthenticated scenarios

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

    - Ensure `DATABASE_TYPE=mock` in test environment
    - Check test setup in `tests/setup.ts`

2. **Token Issues**

    - Use `TestHelpers.generateTestToken()` for consistent tokens
    - Ensure JWT_SECRET is set in test environment

3. **Module Resolution**
    - Jest is configured with path mapping for `@/` imports
    - Check `jest.config.js` for moduleNameMapper settings

### Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run single test with debug info
npm test -- --testNamePattern="specific test name"

# Check test coverage
npm run test:coverage
```

## Future Enhancements

Planned test improvements:

-   [ ] Integration tests with real database
-   [ ] Performance testing
-   [ ] Load testing for file uploads
-   [ ] E2E testing with frontend
-   [ ] API contract testing
-   [ ] Security testing
