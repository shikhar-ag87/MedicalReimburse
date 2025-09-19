// File service for document management
import { apiService } from "./api";

export interface UploadedFile {
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    documentType:
        | "cghs_card"
        | "prescription"
        | "bill"
        | "receipt"
        | "medical_certificate"
        | "other";
    uploadedAt: string;
    uploadedBy: string;
}

export interface FileUploadResponse {
    files: UploadedFile[];
}

export type DocumentType = UploadedFile["documentType"];

class FileService {
    /**
     * Upload files for an application
     */
    async uploadFiles(
        applicationId: string,
        files: File[],
        documentType: DocumentType = "other"
    ): Promise<FileUploadResponse> {
        if (!files || files.length === 0) {
            throw new Error("No files selected for upload");
        }

        // Validate file types and sizes
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        for (const file of files) {
            if (file.size > maxSize) {
                throw new Error(
                    `File "${file.name}" is too large. Maximum size is 10MB.`
                );
            }

            if (!allowedTypes.includes(file.type)) {
                throw new Error(
                    `File "${file.name}" has an unsupported format. Only PDF, images, and Word documents are allowed.`
                );
            }
        }

        const formData = new FormData();
        formData.append("applicationId", applicationId);
        formData.append("documentType", documentType);

        files.forEach((file) => {
            formData.append("files", file);
        });

        const response = await apiService.uploadFile<FileUploadResponse>(
            "/files/upload",
            formData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to upload files");
        }

        return response.data;
    }

    /**
     * Get files for an application
     */
    async getApplicationFiles(
        applicationId: string,
        documentType?: DocumentType
    ): Promise<{ documents: UploadedFile[] }> {
        const params = documentType ? { documentType } : undefined;

        const response = await apiService.get<{ documents: UploadedFile[] }>(
            `/files/application/${applicationId}`,
            params
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch files");
        }

        return response.data;
    }

    /**
     * Download a file
     */
    async downloadFile(fileId: string, fileName: string): Promise<void> {
        try {
            const token = localStorage.getItem("authToken");
            const baseURL =
                import.meta.env.VITE_API_URL || "http://localhost:3001/api";

            const response = await fetch(`${baseURL}/files/${fileId}`, {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to download file: ${response.statusText}`
                );
            }

            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to download file"
            );
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(fileId: string): Promise<void> {
        const response = await apiService.delete(`/files/${fileId}`);

        if (!response.success) {
            throw new Error(response.message || "Failed to delete file");
        }
    }

    /**
     * Get file type icon
     */
    getFileIcon(mimeType: string): string {
        if (mimeType.startsWith("image/")) {
            return "🖼️";
        }

        if (mimeType === "application/pdf") {
            return "📄";
        }

        if (mimeType.includes("word") || mimeType.includes("document")) {
            return "📝";
        }

        return "📎";
    }

    /**
     * Format file size
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    /**
     * Validate file before upload
     */
    validateFile(file: File): { valid: boolean; error?: string } {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File is too large. Maximum size is 10MB.`,
            };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: "Unsupported file format. Only PDF, images, and Word documents are allowed.",
            };
        }

        return { valid: true };
    }

    /**
     * Create file preview URL for images
     */
    createPreviewUrl(file: File): string | null {
        if (!file.type.startsWith("image/")) {
            return null;
        }

        return URL.createObjectURL(file);
    }

    /**
     * Revoke preview URL to prevent memory leaks
     */
    revokePreviewUrl(url: string): void {
        URL.revokeObjectURL(url);
    }

    /**
     * Get document type display name
     */
    getDocumentTypeDisplayName(documentType: DocumentType): string {
        const displayNames: Record<DocumentType, string> = {
            cghs_card: "CGHS Card",
            prescription: "Prescription",
            bill: "Medical Bill",
            receipt: "Receipt",
            medical_certificate: "Medical Certificate",
            other: "Other Document",
        };

        return displayNames[documentType] || documentType;
    }

    /**
     * Get recommended document types for medical applications
     */
    getRecommendedDocumentTypes(): Array<{
        value: DocumentType;
        label: string;
        description: string;
    }> {
        return [
            {
                value: "cghs_card",
                label: "CGHS Card",
                description: "Photocopy of CGHS card",
            },
            {
                value: "prescription",
                label: "Prescription",
                description: "Original prescriptions from doctor",
            },
            {
                value: "bill",
                label: "Medical Bill",
                description: "Original medical bills and invoices",
            },
            {
                value: "receipt",
                label: "Receipt",
                description: "Payment receipts and proof of payment",
            },
            {
                value: "medical_certificate",
                label: "Medical Certificate",
                description: "Medical certificates or discharge summaries",
            },
            {
                value: "other",
                label: "Other",
                description: "Any other supporting documents",
            },
        ];
    }
}

// Create and export singleton instance
export const fileService = new FileService();

// Export class for testing or custom instances
export { FileService };
