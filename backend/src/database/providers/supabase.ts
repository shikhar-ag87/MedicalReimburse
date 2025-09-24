import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
    DatabaseConnection,
    MedicalApplicationRepository,
    ExpenseItemRepository,
    ApplicationDocumentRepository,
    UserRepository,
    AuditLogRepository,
} from "../../types/database";
import { logger } from "../../utils/logger";

// Import repository implementations
import { SupabaseMedicalApplicationRepository } from "../repositories/supabase/MedicalApplicationRepository";
import { SupabaseExpenseItemRepository } from "../repositories/supabase/ExpenseItemRepository";
import { SupabaseAuditLogRepository } from "../repositories/supabase/AuditLogRepository";
import { SupabaseUserRepository } from "../repositories/supabase/UserRepository";

export interface SupabaseConfig {
    url: string;
    key: string;
    serviceKey?: string | undefined;
}

export class SupabaseConnection implements DatabaseConnection {
    private client: SupabaseClient | null = null;
    private serviceClient: SupabaseClient | null = null;
    private connected = false;

    constructor(private config: SupabaseConfig) {}

    async connect(): Promise<void> {
        try {
            // Create main client with anon key
            this.client = createClient(this.config.url, this.config.key);

            // Create service client with service role key if provided
            if (this.config.serviceKey) {
                this.serviceClient = createClient(
                    this.config.url,
                    this.config.serviceKey
                );
            }

            // Test connection by checking if we can access the admin_users table
            const { data, error } = await this.client
                .from("admin_users")
                .select("id")
                .limit(1);

            if (error && error.code !== "PGRST103") {
                // PGRST103 is "no rows found", which is fine
                throw error;
            }

            this.connected = true;
            logger.info("Supabase connection established");
        } catch (error) {
            logger.error("Failed to connect to Supabase:", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.client = null;
        this.serviceClient = null;
        this.connected = false;
        logger.info("Supabase connection closed");
    }

    isConnected(): boolean {
        return this.connected && this.client !== null;
    }

    // Repository methods
    getMedicalApplicationRepository(): MedicalApplicationRepository {
        if (!this.client) {
            throw new Error("Supabase client not initialized");
        }
        return new SupabaseMedicalApplicationRepository(this);
    }

    getExpenseItemRepository(): ExpenseItemRepository {
        if (!this.client) {
            throw new Error("Supabase client not initialized");
        }
        return new SupabaseExpenseItemRepository(this);
    }

    getApplicationDocumentRepository(): ApplicationDocumentRepository {
        if (!this.client) {
            throw new Error("Supabase client not initialized");
        }
        const {
            SupabaseApplicationDocumentRepository,
        } = require("../repositories/supabase/ApplicationDocumentRepository");
        return new SupabaseApplicationDocumentRepository(this);
    }

    getUserRepository(): UserRepository {
        if (!this.client) {
            throw new Error("Supabase client not initialized");
        }
        return new SupabaseUserRepository(this);
    }

    getAuditLogRepository(): AuditLogRepository {
        if (!this.client) {
            throw new Error("Supabase client not initialized");
        }
        return new SupabaseAuditLogRepository(this);
    }

    getClient(): SupabaseClient {
        if (!this.client) {
            throw new Error("Supabase client not initialized");
        }
        return this.client;
    }

    getServiceClient(): SupabaseClient {
        if (!this.serviceClient) {
            throw new Error("Supabase service client not initialized");
        }
        return this.serviceClient;
    }

    // Generic query method - for compatibility with DatabaseConnection interface
    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
        // Note: Supabase doesn't support raw SQL queries directly
        // This method is here for interface compatibility
        // Use the Supabase client methods instead
        throw new Error(
            "Raw SQL queries not supported in Supabase. Use the Supabase client methods instead."
        );
    }

    async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
        // Note: Supabase doesn't support raw SQL queries directly
        // This method is here for interface compatibility
        throw new Error(
            "Raw SQL queries not supported in Supabase. Use the Supabase client methods instead."
        );
    }

    async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
        // Supabase handles transactions differently
        // For now, we'll execute the callback with the client
        // In production, you might want to implement RPC calls for complex transactions
        if (!this.client) {
            throw new Error("Supabase client not initialized");
        }
        return callback(this.client);
    }

    // Supabase-specific helper methods
    async createTable(tableName: string, schema: any): Promise<void> {
        if (!this.serviceClient) {
            throw new Error("Service client required for DDL operations");
        }

        // This would typically be done through migration scripts
        // or the Supabase dashboard
        throw new Error(
            "Table creation should be done through Supabase migrations"
        );
    }

    // Method to execute stored procedures/functions
    async rpc(functionName: string, params?: any): Promise<any> {
        if (!this.client) {
            throw new Error("Supabase client not initialized");
        }

        const { data, error } = await this.client.rpc(functionName, params);

        if (error) {
            logger.error(`RPC function ${functionName} failed:`, error);
            throw error;
        }

        return data;
    }
}
