import {
    User,
    CreateUserData,
    UpdateUserData,
    UserRepository,
} from "../../../types/database";
import { SupabaseConnection } from "../../providers/supabase";

export class SupabaseUserRepository implements UserRepository {
    constructor(private connection: SupabaseConnection) {}

    private mapDatabaseRowToUser(row: any): User {
        const result: User = {
            id: row.id,
            email: row.email,
            password: row.password_hash,
            name: row.name,
            role: row.role,
            employeeId: row.employee_id,
            department: row.department,
            designation: row.designation,
            isActive: row.is_active,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };

        if (row.last_login) {
            result.lastLogin = new Date(row.last_login);
        }

        return result;
    }

    async create(data: CreateUserData): Promise<User> {
        const client = this.connection.getClient();
        const { data: result, error } = await client
            .from("admin_users")
            .insert({
                email: data.email,
                password: data.password,
                name: data.name,
                role: data.role,
                employee_id: data.employeeId,
                department: data.department,
                designation: data.designation,
                is_active: data.isActive ?? true,
            })
            .select()
            .single();

        if (error) throw error;

        return this.mapDatabaseRowToUser(result);
    }

    async findById(id: string): Promise<User | null> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("admin_users")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") return null; // No rows found
            throw error;
        }

        return this.mapDatabaseRowToUser(data);
    }

    async findByEmail(email: string): Promise<User | null> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("admin_users")
            .select("*")
            .eq("email", email)
            .single();

        if (error) {
            if (error.code === "PGRST116") return null; // No rows found
            throw error;
        }

        return this.mapDatabaseRowToUser(data);
    }

    async findByEmployeeId(employeeId: string): Promise<User | null> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("admin_users")
            .select("*")
            .eq("employee_id", employeeId)
            .single();

        if (error) {
            if (error.code === "PGRST116") return null; // No rows found
            throw error;
        }

        return this.mapDatabaseRowToUser(data);
    }

    async findByRole(role: User["role"]): Promise<User[]> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("admin_users")
            .select("*")
            .eq("role", role)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data.map(this.mapDatabaseRowToUser.bind(this));
    }

    async findAll(filters?: Partial<User>): Promise<User[]> {
        const client = this.connection.getClient();
        let query = client
            .from("admin_users")
            .select("*")
            .order("created_at", { ascending: false });

        // Apply filters if provided
        if (filters?.role) {
            query = query.eq("role", filters.role);
        }
        if (filters?.isActive !== undefined) {
            query = query.eq("is_active", filters.isActive);
        }
        if (filters?.department) {
            query = query.eq("department", filters.department);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data.map(this.mapDatabaseRowToUser.bind(this));
    }

    async update(
        id: string,
        data: Partial<UpdateUserData>
    ): Promise<User | null> {
        const client = this.connection.getClient();
        const updateData: any = {};

        // Map fields to snake_case for database
        if (data.password !== undefined) updateData.password = data.password;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.employeeId !== undefined)
            updateData.employee_id = data.employeeId;
        if (data.department !== undefined)
            updateData.department = data.department;
        if (data.designation !== undefined)
            updateData.designation = data.designation;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;

        const { data: result, error } = await client
            .from("admin_users")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (error.code === "PGRST116") return null; // No rows found
            throw error;
        }

        return this.mapDatabaseRowToUser(result);
    }

    async updateLastLogin(id: string): Promise<void> {
        const client = this.connection.getClient();
        const { error } = await client
            .from("admin_users")
            .update({ last_login: new Date().toISOString() })
            .eq("id", id);

        if (error) throw error;
    }

    async deactivateUser(id: string): Promise<boolean> {
        const client = this.connection.getClient();
        const { error } = await client
            .from("admin_users")
            .update({ is_active: false })
            .eq("id", id);

        if (error) throw error;
        return true;
    }

    async delete(id: string): Promise<boolean> {
        const client = this.connection.getClient();
        const { error } = await client
            .from("admin_users")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return true;
    }

    async count(filters?: Partial<User>): Promise<number> {
        const client = this.connection.getClient();
        let query = client
            .from("admin_users")
            .select("id", { count: "exact", head: true });

        // Apply filters if provided
        if (filters?.role) {
            query = query.eq("role", filters.role);
        }
        if (filters?.isActive !== undefined) {
            query = query.eq("is_active", filters.isActive);
        }
        if (filters?.department) {
            query = query.eq("department", filters.department);
        }

        const { count, error } = await query;

        if (error) throw error;
        return count || 0;
    }
}
