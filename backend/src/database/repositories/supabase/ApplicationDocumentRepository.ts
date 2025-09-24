import {
    ApplicationDocument,
    CreateApplicationDocumentData,
    UpdateApplicationDocumentData,
    ApplicationDocumentRepository,
} from "../../../types/database";
import { SupabaseConnection } from "../../providers/supabase";

export class SupabaseApplicationDocumentRepository
    implements ApplicationDocumentRepository
{
    constructor(private connection: SupabaseConnection) {}

    async create(
        data: CreateApplicationDocumentData
    ): Promise<ApplicationDocument> {
        const client = this.connection.getClient();
        const { data: result, error } = await client
            .from("application_documents")
            .insert({
                application_id: data.applicationId,
                file_name: data.fileName,
                original_name: data.originalName,
                file_path: data.filePath,
                file_size: data.fileSize,
                mime_type: data.mimeType,
                document_type: data.documentType,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: result.id,
            applicationId: result.application_id,
            fileName: result.file_name,
            originalName: result.original_name,
            filePath: result.file_path,
            fileSize: result.file_size,
            mimeType: result.mime_type,
            documentType: result.document_type,
            uploadedAt: new Date(result.uploaded_at),
        };
    }

    async findById(id: string): Promise<ApplicationDocument | null> {
        const client = this.connection.getClient();
        const { data, error } = await client
            .from("application_documents")
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
            fileName: data.file_name,
            originalName: data.original_name,
            filePath: data.file_path,
            fileSize: data.file_size,
            mimeType: data.mime_type,
            documentType: data.document_type,
            uploadedAt: new Date(data.uploaded_at),
        };
    }

    async findAll(
        filters?: Partial<ApplicationDocument>
    ): Promise<ApplicationDocument[]> {
        const client = this.connection.getClient();
        let query = client.from("application_documents").select("*");

        if (filters?.applicationId) {
            query = query.eq("application_id", filters.applicationId);
        }
        if (filters?.documentType) {
            query = query.eq("document_type", filters.documentType);
        }

        const { data, error } = await query.order("uploaded_at", {
            ascending: false,
        });
        if (error) throw error;

        return data.map((item) => ({
            id: item.id,
            applicationId: item.application_id,
            fileName: item.file_name,
            originalName: item.original_name,
            filePath: item.file_path,
            fileSize: item.file_size,
            mimeType: item.mime_type,
            documentType: item.document_type,
            uploadedAt: new Date(item.uploaded_at),
        }));
    }

    async update(
        id: string,
        data: UpdateApplicationDocumentData
    ): Promise<ApplicationDocument | null> {
        const client = this.connection.getClient();
        const updateData: any = {};

        if (data.fileName !== undefined) updateData.file_name = data.fileName;
        if (data.originalName !== undefined)
            updateData.original_name = data.originalName;
        if (data.filePath !== undefined) updateData.file_path = data.filePath;
        if (data.fileSize !== undefined) updateData.file_size = data.fileSize;
        if (data.mimeType !== undefined) updateData.mime_type = data.mimeType;
        if (data.documentType !== undefined)
            updateData.document_type = data.documentType;

        const { data: result, error } = await client
            .from("application_documents")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (error.code === "PGRST116") return null; // No rows found
            throw error;
        }

        return {
            id: result.id,
            applicationId: result.application_id,
            fileName: result.file_name,
            originalName: result.original_name,
            filePath: result.file_path,
            fileSize: result.file_size,
            mimeType: result.mime_type,
            documentType: result.document_type,
            uploadedAt: new Date(result.uploaded_at),
        };
    }

    async delete(id: string): Promise<boolean> {
        const client = this.connection.getClient();
        const { error } = await client
            .from("application_documents")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return true;
    }

    async count(filters?: Partial<ApplicationDocument>): Promise<number> {
        const client = this.connection.getClient();
        let query = client
            .from("application_documents")
            .select("*", { count: "exact", head: true });

        if (filters?.applicationId) {
            query = query.eq("application_id", filters.applicationId);
        }
        if (filters?.documentType) {
            query = query.eq("document_type", filters.documentType);
        }

        const { count, error } = await query;
        if (error) throw error;

        return count || 0;
    }

    async findByApplicationId(
        applicationId: string
    ): Promise<ApplicationDocument[]> {
        return this.findAll({ applicationId });
    }

    async findByDocumentType(
        documentType: ApplicationDocument["documentType"]
    ): Promise<ApplicationDocument[]> {
        return this.findAll({ documentType });
    }
}
