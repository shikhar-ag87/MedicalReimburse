import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DatabaseConnection } from "@/types/database";
import { logger } from "@/utils/logger";

export interface SupabaseConfig {
    url: string;
    key: string;
    serviceKey?: string;
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

            // Test connection
            const { data, error } = await this.client
                .from("_test")
                .select("*")
                .limit(1);

            if (
                error &&
                !error.message.includes('relation "_test" does not exist')
            ) {
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
