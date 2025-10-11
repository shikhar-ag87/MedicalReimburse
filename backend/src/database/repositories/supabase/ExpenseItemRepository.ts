import { SupabaseClient } from "@supabase/supabase-js";
import {
    ExpenseItem,
    CreateExpenseItemData,
    UpdateExpenseItemData,
    ExpenseItemRepository,
} from "../../../types/database";
import { SupabaseConnection } from "../../providers/supabase";

export class SupabaseExpenseItemRepository implements ExpenseItemRepository {
    constructor(private connection: SupabaseConnection) {}

    async create(data: CreateExpenseItemData): Promise<ExpenseItem> {
        const client = this.connection.getClient();
        const { data: result, error } = await client
            .from("expense_items")
            .insert({
                application_id: data.applicationId,
                bill_number: data.billNumber,
                bill_date: data.billDate,
                description: data.description,
                amount_claimed: data.amountClaimed,
                amount_approved: data.amountPassed || 0,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: result.id,
            applicationId: result.application_id,
            billNumber: result.bill_number,
            billDate: new Date(result.bill_date),
            description: result.description,
            amountClaimed: parseFloat(result.amount_claimed),
            amountPassed: parseFloat(result.amount_approved || 0),
            createdAt: new Date(result.created_at),
            updatedAt: new Date(result.updated_at),
        };
    }

    async findById(id: string): Promise<ExpenseItem | null> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("expense_items")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") return null; // No rows found
            throw error;
        }

        return {
            id: data.id,
            applicationId: data.application_id,
            billNumber: data.bill_number,
            billDate: new Date(data.bill_date),
            description: data.description,
            amountClaimed: parseFloat(data.amount_claimed),
            amountPassed: parseFloat(data.amount_approved || 0),
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }

    async findAll(filters?: Partial<ExpenseItem>): Promise<ExpenseItem[]> {
        const client = this.connection.getClient();
        let query = client.from("expense_items").select("*");

        if (filters?.applicationId) {
            query = query.eq("application_id", filters.applicationId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((item) => ({
            id: item.id,
            applicationId: item.application_id,
            billNumber: item.bill_number,
            billDate: new Date(item.bill_date),
            description: item.description,
            amountClaimed: parseFloat(item.amount_claimed),
            amountPassed: parseFloat(item.amount_approved || 0),
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
        }));
    }

    async findByApplicationId(applicationId: string): Promise<ExpenseItem[]> {
        return this.findAll({ applicationId });
    }

    async getTotalAmountByApplication(
        applicationId: string
    ): Promise<{ claimed: number; passed: number }> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("expense_items")
            .select("amount_claimed, amount_approved")
            .eq("application_id", applicationId);

        if (error) throw error;

        const claimed = data.reduce(
            (sum, item) => sum + parseFloat(item.amount_claimed || 0),
            0
        );
        const passed = data.reduce(
            (sum, item) => sum + parseFloat(item.amount_approved || 0),
            0
        );

        return { claimed, passed };
    }

    async update(
        id: string,
        data: Partial<UpdateExpenseItemData>
    ): Promise<ExpenseItem | null> {
        const client = this.connection.getClient();
        const updateData: any = {};

        if (data.billNumber) updateData.bill_number = data.billNumber;
        if (data.billDate) updateData.bill_date = data.billDate;
        if (data.description) updateData.description = data.description;
        if (data.amountClaimed !== undefined)
            updateData.amount_claimed = data.amountClaimed;
        if (data.amountPassed !== undefined)
            updateData.amount_approved = data.amountPassed;

        const { data: result, error } = await client
            .from("expense_items")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (error.code === "PGRST116") return null;
            throw error;
        }

        return {
            id: result.id,
            applicationId: result.application_id,
            billNumber: result.bill_number,
            billDate: new Date(result.bill_date),
            description: result.description,
            amountClaimed: parseFloat(result.amount_claimed),
            amountPassed: parseFloat(result.amount_approved || 0),
            createdAt: new Date(result.created_at),
            updatedAt: new Date(result.updated_at),
        };
    }

    async delete(id: string): Promise<boolean> {
        const client = this.connection.getClient();
        const { error } = await client
            .from("expense_items")
            .delete()
            .eq("id", id);

        return !error;
    }

    async count(filters?: Partial<ExpenseItem>): Promise<number> {
        const client = this.connection.getClient();
        let query = client
            .from("expense_items")
            .select("*", { count: "exact", head: true });

        if (filters?.applicationId) {
            query = query.eq("application_id", filters.applicationId);
        }

        const { count, error } = await query;
        if (error) throw error;

        return count || 0;
    }
}
