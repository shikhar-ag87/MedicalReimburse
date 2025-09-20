/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src", "<rootDir>/tests"],
    testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: false,
                tsconfig: {
                    module: "commonjs",
                },
            },
        ],
    },
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/*.d.ts",
        "!src/types/**",
        "!src/server.ts",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
    testTimeout: 30000,
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^@faker-js/faker$": "<rootDir>/tests/__mocks__/@faker-js/faker.ts",
    },
    // Handle ES modules
    extensionsToTreatAsEsm: [],
    transformIgnorePatterns: ["node_modules/(?!(@faker-js/faker)/)"],
    // Environment variables for tests
    testEnvironmentOptions: {
        NODE_ENV: "test",
    },
};
