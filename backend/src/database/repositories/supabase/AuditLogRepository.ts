import {
    AuditLog,
    CreateAuditLogData,
    AuditLogRepository,
} from "../../../types/database";
import { SupabaseConnection } from "../../providers/supabase";

export class SupabaseAuditLogRepository implements AuditLogRepository {
    constructor(private connection: SupabaseConnection) {}

    async create(data: CreateAuditLogData): Promise<AuditLog> {
        const client = this.connection.getClient();
        const { data: result, error } = await client
            .from("audit_logs")
            .insert({
                entity_type: data.entityType,
                entity_id: data.entityId,
                action: data.action,
                changes: data.changes,
                ip_address: data.ipAddress,
                user_agent: data.userAgent,
                // admin_user_id will be null for anonymous operations
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: result.id,
            entityType: result.entity_type,
            entityId: result.entity_id,
            action: result.action,
            changes: result.changes,
            ipAddress: result.ip_address,
            userAgent: result.user_agent,
            timestamp: new Date(result.timestamp),
        };
    }

    async findById(id: string): Promise<AuditLog | null> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("audit_logs")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") return null; // No rows found
            throw error;
        }

        return {
            id: data.id,
            entityType: data.entity_type,
            entityId: data.entity_id,
            action: data.action,
            changes: data.changes,
            ipAddress: data.ip_address,
            userAgent: data.user_agent,
            timestamp: new Date(data.timestamp),
        };
    }

    async findAll(filters?: Partial<AuditLog>): Promise<AuditLog[]> {
        const client = this.connection.getClient();
        let query = client.from("audit_logs").select("*");

        if (filters) {
            if (filters.entityType) {
                query = query.eq("entity_type", filters.entityType);
            }
            if (filters.entityId) {
                query = query.eq("entity_id", filters.entityId);
            }
            if (filters.action) {
                query = query.eq("action", filters.action);
            }
        }

        query = query.order("timestamp", { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            entityType: item.entity_type,
            entityId: item.entity_id,
            action: item.action,
            changes: item.changes,
            ipAddress: item.ip_address,
            userAgent: item.user_agent,
            timestamp: new Date(item.timestamp),
        }));
    }

    async update(
        id: string,
        data: Partial<AuditLog>
    ): Promise<AuditLog | null> {
        // Audit logs are typically immutable
        throw new Error("Audit logs cannot be updated");
    }

    async delete(id: string): Promise<boolean> {
        // Audit logs are typically immutable
        throw new Error("Audit logs cannot be deleted");
    }

    async count(filters?: Partial<AuditLog>): Promise<number> {
        const client = this.connection.getClient();
        let query = client.from("audit_logs").select("*", { count: "exact" });

        if (filters) {
            if (filters.entityType) {
                query = query.eq("entity_type", filters.entityType);
            }
            if (filters.entityId) {
                query = query.eq("entity_id", filters.entityId);
            }
            if (filters.action) {
                query = query.eq("action", filters.action);
            }
        }

        const { count, error } = await query;

        if (error) throw error;

        return count || 0;
    }

    async findByEntityId(entityId: string): Promise<AuditLog[]> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("audit_logs")
            .select("*")
            .eq("entity_id", entityId)
            .order("timestamp", { ascending: false });

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            entityType: item.entity_type,
            entityId: item.entity_id,
            action: item.action,
            changes: item.changes,
            ipAddress: item.ip_address,
            userAgent: item.user_agent,
            timestamp: new Date(item.timestamp),
        }));
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("audit_logs")
            .select("*")
            .gte("timestamp", startDate.toISOString())
            .lte("timestamp", endDate.toISOString())
            .order("timestamp", { ascending: false });

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            entityType: item.entity_type,
            entityId: item.entity_id,
            action: item.action,
            changes: item.changes,
            ipAddress: item.ip_address,
            userAgent: item.user_agent,
            timestamp: new Date(item.timestamp),
        }));
    }
}
