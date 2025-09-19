import { DatabaseConfig, DatabaseConnection } from "@/types/database";
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
