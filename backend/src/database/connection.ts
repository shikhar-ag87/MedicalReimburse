import {
    DatabaseConfig,
    DatabaseConnection,
    MedicalApplication,
    CreateMedicalApplicationData,
    UpdateMedicalApplicationData,
    User,
    CreateUserData,
    UpdateUserData,
    ExpenseItem,
    CreateExpenseItemData,
    UpdateExpenseItemData,
    ApplicationDocument,
    CreateApplicationDocumentData,
    AuditLog,
    CreateAuditLogData,
    MedicalApplicationRepository,
    UserRepository,
    ExpenseItemRepository,
    ApplicationDocumentRepository,
    AuditLogRepository,
} from "../types/database";
import { SupabaseConnection } from "./providers/supabase";
// import { PostgreSQLConnection } from "./providers/postgresql";
import { logger } from "../utils/logger";

/**
 * Database Connection Factory
 * Allows easy switching between different database providers
 */
export class DatabaseConnectionFactory {
    static create(config: DatabaseConfig): DatabaseConnection {
        switch (config.type) {
            case "supabase":
                if (!config.supabaseUrl || !config.supabaseKey) {
                    throw new Error(
                        "Supabase URL and key are required for Supabase connection"
                    );
                }
                const supabaseConfig: {
                    url: string;
                    key: string;
                    serviceKey?: string;
                } = {
                    url: config.supabaseUrl,
                    key: config.supabaseKey,
                };

                if (config.serviceKey) {
                    supabaseConfig.serviceKey = config.serviceKey;
                }

                return new SupabaseConnection(supabaseConfig);

            case "postgresql":
                if (
                    !config.connectionString &&
                    (!config.host || !config.database)
                ) {
                    throw new Error(
                        "PostgreSQL connection string or host/database are required"
                    );
                }
                // return new PostgreSQLConnection(config);
                throw new Error("PostgreSQL connection not yet implemented");

            case "mysql":
                throw new Error("MySQL support not yet implemented");

            case "mongodb":
                throw new Error("MongoDB support not yet implemented");

            case "mock":
                return new MockDatabaseConnection() as any;

            default:
                throw new Error(`Unsupported database type: ${config.type}`);
        }
    }
}

let dbConnection: DatabaseConnection | null = null;

/**
 * Get the current database connection
 */
export function getDatabase(): DatabaseConnection {
    if (!dbConnection) {
        throw new Error(
            "Database not connected. Call connectDatabase() first."
        );
    }
    return dbConnection;
}

/**
 * Connect to the database based on environment configuration
 */
export async function connectDatabase(): Promise<DatabaseConnection> {
    if (dbConnection && dbConnection.isConnected()) {
        return dbConnection;
    }

    const databaseType: DatabaseConfig["type"] =
        (process.env.DATABASE_TYPE as DatabaseConfig["type"]) || "supabase";

    // In development or test mode, use mock connection
    if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test" ||
        databaseType === "mock" ||
        !process.env.SUPABASE_URL ||
        process.env.SUPABASE_URL === "https://your-project.supabase.co"
    ) {
        logger.warn("Using mock database connection");
        dbConnection = new MockDatabaseConnection();
        await dbConnection.connect();
        return dbConnection;
    }

    let config: DatabaseConfig;

    switch (databaseType) {
        case "supabase":
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;
            const serviceKey = process.env.SUPABASE_SERVICE_KEY;

            if (!supabaseUrl || !supabaseKey) {
                throw new Error(
                    "SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required for Supabase connection"
                );
            }

            const configObj: DatabaseConfig = {
                type: "supabase",
                supabaseUrl,
                supabaseKey,
            };

            if (serviceKey) {
                configObj.serviceKey = serviceKey;
            }

            config = configObj;
            break;

        case "postgresql":
            const pgConnectionString = process.env.DATABASE_URL;
            const pgHost = process.env.DB_HOST;
            const pgDatabase = process.env.DB_NAME;
            const pgUsername = process.env.DB_USER;
            const pgPassword = process.env.DB_PASSWORD;

            const pgConfigObj: DatabaseConfig = {
                type: "postgresql",
                port: parseInt(process.env.DB_PORT || "5432"),
                ssl: process.env.DB_SSL === "true",
            };

            if (pgConnectionString)
                pgConfigObj.connectionString = pgConnectionString;
            if (pgHost) pgConfigObj.host = pgHost;
            if (pgDatabase) pgConfigObj.database = pgDatabase;
            if (pgUsername) pgConfigObj.username = pgUsername;
            if (pgPassword) pgConfigObj.password = pgPassword;

            config = pgConfigObj;
            break;

        case "mock":
            dbConnection = new MockDatabaseConnection();
            await dbConnection.connect();
            return dbConnection;

        default:
            throw new Error(`Unsupported database type: ${databaseType}`);
    }

    try {
        dbConnection = DatabaseConnectionFactory.create(config);
        await dbConnection.connect();

        logger.info(`Connected to ${databaseType} database successfully`);
        return dbConnection;
    } catch (error) {
        logger.error(`Failed to connect to ${databaseType} database:`, error);

        // In development, fall back to mock connection
        if (
            process.env.NODE_ENV === "development" ||
            process.env.NODE_ENV === "test"
        ) {
            logger.warn(
                "Falling back to mock database connection for development"
            );
            dbConnection = new MockDatabaseConnection();
            await dbConnection.connect();
            return dbConnection;
        }

        throw error;
    }
}

// Mock database connection for development
class MockDatabaseConnection implements DatabaseConnection {
    private connected = false;

    async connect(): Promise<void> {
        this.connected = true;
        logger.info("Mock database connection established");
    }

    async disconnect(): Promise<void> {
        this.connected = false;
        logger.info("Mock database connection closed");
    }

    isConnected(): boolean {
        return this.connected;
    }

    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
        logger.debug(`Mock query executed: ${sql}`, params);
        return [] as T[];
    }

    async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
        logger.debug(`Mock queryOne executed: ${sql}`, params);
        return null;
    }

    async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
        logger.debug("Mock transaction executed");
        return callback(this);
    }

    getMedicalApplicationRepository() {
        return new MockMedicalApplicationRepository();
    }

    getExpenseItemRepository() {
        return new MockExpenseItemRepository();
    }

    getApplicationDocumentRepository() {
        return new MockApplicationDocumentRepository();
    }

    getUserRepository() {
        return new MockUserRepository();
    }

    getAuditLogRepository() {
        return new MockAuditLogRepository();
    }
}

/**
 * Clear all mock data (for testing)
 */
export function clearMockData(): void {
    MockUserRepository.clearAll();
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
    if (dbConnection) {
        await dbConnection.disconnect();
        dbConnection = null;
        logger.info("Disconnected from database");
    }
}

// Mock repository implementations for development
class MockMedicalApplicationRepository implements MedicalApplicationRepository {
    async create(
        data: CreateMedicalApplicationData
    ): Promise<MedicalApplication> {
        const mockApp: MedicalApplication = {
            id: `app-${Date.now()}`,
            applicationNumber: `MR-${new Date().getFullYear()}-${Math.floor(
                Math.random() * 10000
            )
                .toString()
                .padStart(4, "0")}`,
            submittedAt: new Date(),
            updatedAt: new Date(),
            ...data,
        };
        logger.debug("Mock application created:", mockApp.id);
        return mockApp;
    }

    async findById(id: string): Promise<MedicalApplication | null> {
        logger.debug("Mock findById called:", id);
        return null;
    }

    async findAll(): Promise<MedicalApplication[]> {
        logger.debug("Mock findAll called");
        return [];
    }

    async update(
        id: string,
        data: Partial<UpdateMedicalApplicationData>
    ): Promise<MedicalApplication | null> {
        logger.debug("Mock update called:", id, data);
        return null;
    }

    async delete(id: string): Promise<boolean> {
        logger.debug("Mock delete called:", id);
        return true;
    }

    async count(): Promise<number> {
        return 0;
    }

    async findByEmployeeId(employeeId: string): Promise<MedicalApplication[]> {
        logger.debug("Mock findByEmployeeId called:", employeeId);
        return [];
    }

    async findByStatus(
        status: MedicalApplication["status"]
    ): Promise<MedicalApplication[]> {
        logger.debug("Mock findByStatus called:", status);
        return [];
    }

    async findByApplicationNumber(
        applicationNumber: string
    ): Promise<MedicalApplication | null> {
        logger.debug("Mock findByApplicationNumber called:", applicationNumber);
        return null;
    }

    async updateStatus(
        id: string,
        status: MedicalApplication["status"],
        reviewerId?: string,
        comments?: string
    ): Promise<MedicalApplication | null> {
        logger.debug(
            "Mock updateStatus called:",
            id,
            status,
            reviewerId,
            comments
        );
        return null;
    }

    async getApplicationsForReview(): Promise<MedicalApplication[]> {
        logger.debug("Mock getApplicationsForReview called");
        return [];
    }

    async getApplicationStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        completed: number;
    }> {
        logger.debug("Mock getApplicationStats called");
        return { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 };
    }
}

class MockUserRepository implements UserRepository {
    private static users: Map<string, User> = new Map();
    private static emailIndex: Map<string, string> = new Map(); // email -> userId
    private static employeeIndex: Map<string, string> = new Map(); // employeeId -> userId

    async create(data: CreateUserData): Promise<User> {
        const mockUser: User = {
            id: `user-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: new Date(),
            ...data,
        };

        // Store in memory
        MockUserRepository.users.set(mockUser.id, mockUser);
        MockUserRepository.emailIndex.set(mockUser.email, mockUser.id);
        if (mockUser.employeeId) {
            MockUserRepository.employeeIndex.set(
                mockUser.employeeId,
                mockUser.id
            );
        }

        logger.debug("Mock user created:", mockUser.id);
        return mockUser;
    }

    async findById(id: string): Promise<User | null> {
        logger.debug("Mock user findById called:", id);
        return MockUserRepository.users.get(id) || null;
    }

    async findAll(): Promise<User[]> {
        return Array.from(MockUserRepository.users.values());
    }

    async update(
        id: string,
        data: Partial<UpdateUserData>
    ): Promise<User | null> {
        logger.debug("Mock user update called:", id);
        const user = MockUserRepository.users.get(id);
        if (!user) return null;

        const updatedUser = { ...user, ...data, updatedAt: new Date() };
        MockUserRepository.users.set(id, updatedUser);
        return updatedUser;
    }

    async delete(id: string): Promise<boolean> {
        logger.debug("Mock user delete called:", id);
        const user = MockUserRepository.users.get(id);
        if (!user) return false;

        MockUserRepository.users.delete(id);
        MockUserRepository.emailIndex.delete(user.email);
        if (user.employeeId) {
            MockUserRepository.employeeIndex.delete(user.employeeId);
        }
        return true;
    }

    async count(): Promise<number> {
        return MockUserRepository.users.size;
    }

    async findByEmail(email: string): Promise<User | null> {
        logger.debug("Mock findByEmail called:", email);
        const userId = MockUserRepository.emailIndex.get(email);
        return userId ? MockUserRepository.users.get(userId) || null : null;
    }

    async findByEmployeeId(employeeId: string): Promise<User | null> {
        logger.debug("Mock findByEmployeeId called:", employeeId);
        const userId = MockUserRepository.employeeIndex.get(employeeId);
        return userId ? MockUserRepository.users.get(userId) || null : null;
    }

    async findByRole(role: User["role"]): Promise<User[]> {
        logger.debug("Mock findByRole called:", role);
        return Array.from(MockUserRepository.users.values()).filter(
            (user) => user.role === role
        );
    }

    async updateLastLogin(id: string): Promise<void> {
        logger.debug("Mock updateLastLogin called:", id);
        const user = MockUserRepository.users.get(id);
        if (user) {
            user.lastLogin = new Date();
            MockUserRepository.users.set(id, user);
        }
    }

    async deactivateUser(id: string): Promise<boolean> {
        logger.debug("Mock deactivateUser called:", id);
        const user = MockUserRepository.users.get(id);
        if (!user) return false;

        user.isActive = false;
        MockUserRepository.users.set(id, user);
        return true;
    }

    // Static method to clear all data (for testing)
    static clearAll(): void {
        this.users.clear();
        this.emailIndex.clear();
        this.employeeIndex.clear();
    }
}

class MockExpenseItemRepository implements ExpenseItemRepository {
    async create(data: CreateExpenseItemData): Promise<ExpenseItem> {
        const mockExpense: ExpenseItem = {
            id: `expense-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        };
        logger.debug("Mock expense created:", mockExpense.id);
        return mockExpense;
    }

    async findById(id: string): Promise<ExpenseItem | null> {
        return null;
    }

    async findAll(): Promise<ExpenseItem[]> {
        return [];
    }

    async update(
        id: string,
        data: Partial<UpdateExpenseItemData>
    ): Promise<ExpenseItem | null> {
        return null;
    }

    async delete(id: string): Promise<boolean> {
        return true;
    }

    async count(): Promise<number> {
        return 0;
    }

    async findByApplicationId(applicationId: string): Promise<ExpenseItem[]> {
        logger.debug("Mock findByApplicationId called:", applicationId);
        return [];
    }

    async getTotalAmountByApplication(
        applicationId: string
    ): Promise<{ claimed: number; passed: number }> {
        logger.debug("Mock getTotalAmountByApplication called:", applicationId);
        return { claimed: 0, passed: 0 };
    }
}

class MockApplicationDocumentRepository
    implements ApplicationDocumentRepository
{
    async create(
        data: CreateApplicationDocumentData
    ): Promise<ApplicationDocument> {
        const mockDoc: ApplicationDocument = {
            id: `doc-${Date.now()}`,
            uploadedAt: new Date(),
            ...data,
        };
        logger.debug("Mock document created:", mockDoc.id);
        return mockDoc;
    }

    async findById(id: string): Promise<ApplicationDocument | null> {
        logger.debug("Mock document findById called:", id);
        return null;
    }

    async findAll(): Promise<ApplicationDocument[]> {
        return [];
    }

    async update(
        id: string,
        data: Partial<ApplicationDocument>
    ): Promise<ApplicationDocument | null> {
        return null;
    }

    async delete(id: string): Promise<boolean> {
        logger.debug("Mock document delete called:", id);
        return true;
    }

    async count(): Promise<number> {
        return 0;
    }

    async findByApplicationId(
        applicationId: string
    ): Promise<ApplicationDocument[]> {
        logger.debug("Mock findByApplicationId called:", applicationId);
        return [];
    }

    async findByDocumentType(
        applicationId: string,
        documentType: ApplicationDocument["documentType"]
    ): Promise<ApplicationDocument[]> {
        logger.debug(
            "Mock findByDocumentType called:",
            applicationId,
            documentType
        );
        return [];
    }
}

class MockAuditLogRepository implements AuditLogRepository {
    async create(data: CreateAuditLogData): Promise<AuditLog> {
        const mockAudit: AuditLog = {
            id: `audit-${Date.now()}`,
            timestamp: new Date(),
            ...data,
        };
        logger.debug("Mock audit log created:", mockAudit.id);
        return mockAudit;
    }

    async findById(id: string): Promise<AuditLog | null> {
        return null;
    }

    async findAll(): Promise<AuditLog[]> {
        return [];
    }

    async update(
        id: string,
        data: Partial<AuditLog>
    ): Promise<AuditLog | null> {
        return null;
    }

    async delete(id: string): Promise<boolean> {
        return true;
    }

    async count(): Promise<number> {
        return 0;
    }

    async findByEntityId(
        entityType: AuditLog["entityType"],
        entityId: string
    ): Promise<AuditLog[]> {
        logger.debug("Mock findByEntityId called:", entityType, entityId);
        return [];
    }

    async findByUserId(userId: string): Promise<AuditLog[]> {
        logger.debug("Mock findByUserId called:", userId);
        return [];
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
        logger.debug("Mock findByDateRange called:", startDate, endDate);
        return [];
    }
}
