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
} from "@/types/database";
import { SupabaseConnection } from "./providers/supabase";
import { PostgreSQLConnection } from "./providers/postgresql";
import { logger } from "@/utils/logger";

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
                return new SupabaseConnection({
                    url: config.supabaseUrl,
                    key: config.supabaseKey,
                    serviceKey: config.serviceKey,
                });

            case "postgresql":
                if (
                    !config.connectionString &&
                    (!config.host || !config.database)
                ) {
                    throw new Error(
                        "PostgreSQL connection string or host/database are required"
                    );
                }
                return new PostgreSQLConnection(config);

            case "mysql":
                throw new Error("MySQL support not yet implemented");

            case "mongodb":
                throw new Error("MongoDB support not yet implemented");

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

    const databaseType =
        (process.env.DATABASE_TYPE as DatabaseConfig["type"]) || "supabase";

    // In development mode, if no database credentials are provided, create a mock connection
    if (
        process.env.NODE_ENV === "development" &&
        (!process.env.SUPABASE_URL ||
            process.env.SUPABASE_URL === "https://your-project.supabase.co")
    ) {
        logger.warn("Using mock database connection for development");
        dbConnection = new MockDatabaseConnection();
        await dbConnection.connect();
        return dbConnection;
    }

    let config: DatabaseConfig;

    switch (databaseType) {
        case "supabase":
            config = {
                type: "supabase",
                supabaseUrl: process.env.SUPABASE_URL,
                supabaseKey: process.env.SUPABASE_ANON_KEY,
                serviceKey: process.env.SUPABASE_SERVICE_KEY,
            };
            break;

        case "postgresql":
            config = {
                type: "postgresql",
                connectionString: process.env.POSTGRES_URL,
                host: process.env.POSTGRES_HOST,
                port: parseInt(process.env.POSTGRES_PORT || "5432"),
                database: process.env.POSTGRES_DB,
                username: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASSWORD,
                ssl: process.env.POSTGRES_SSL === "true",
            };
            break;

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
        if (process.env.NODE_ENV === "development") {
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
    async create(data: CreateUserData): Promise<User> {
        const mockUser: User = {
            id: `user-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: new Date(),
            ...data,
        };
        logger.debug("Mock user created:", mockUser.id);
        return mockUser;
    }

    async findById(id: string): Promise<User | null> {
        logger.debug("Mock user findById called:", id);
        return null;
    }

    async findAll(): Promise<User[]> {
        return [];
    }

    async update(
        id: string,
        data: Partial<UpdateUserData>
    ): Promise<User | null> {
        logger.debug("Mock user update called:", id);
        return null;
    }

    async delete(id: string): Promise<boolean> {
        logger.debug("Mock user delete called:", id);
        return true;
    }

    async count(): Promise<number> {
        return 0;
    }

    async findByEmail(email: string): Promise<User | null> {
        logger.debug("Mock findByEmail called:", email);
        return null;
    }

    async findByEmployeeId(employeeId: string): Promise<User | null> {
        logger.debug("Mock findByEmployeeId called:", employeeId);
        return null;
    }

    async findByRole(role: User["role"]): Promise<User[]> {
        logger.debug("Mock findByRole called:", role);
        return [];
    }

    async updateLastLogin(id: string): Promise<void> {
        logger.debug("Mock updateLastLogin called:", id);
    }

    async deactivateUser(id: string): Promise<boolean> {
        logger.debug("Mock deactivateUser called:", id);
        return true;
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
