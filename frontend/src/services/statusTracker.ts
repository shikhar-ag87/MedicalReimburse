// Status tracker service for application status tracking
import { apiService } from "./api";
import { userService } from "./users";

export interface ApplicationStatus {
    id: string;
    applicationId: string;
    applicationNumber: string;
    status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "clarification_required";
    submittedAt: string;
    reviewedAt?: string;
    updatedAt: string;
    patientName: string;
    treatmentType: string;
    totalAmount: number;
    reviewedBy?: string;
    comments?: string;
    estimatedProcessingTime?: number; // in days
    actualProcessingTime?: number; // in days
    nextAction?: string;
    documents: {
        id: string;
        fileName: string;
        documentType: string;
        uploadedAt: string;
    }[];
    statusHistory: {
        id: string;
        status: string;
        updatedAt: string;
        updatedBy: string;
        comments?: string;
        actionTaken?: string;
    }[];
}

export interface StatusTrackingParams {
    applicationNumber?: string;
    applicationId?: string;
    includeHistory?: boolean;
    includeDocuments?: boolean;
}

export interface BulkStatusUpdate {
    applicationIds: string[];
    status: ApplicationStatus["status"];
    comments?: string;
}

class StatusTrackerService {
    /**
     * Track application status by application number
     */
    async trackByApplicationNumber(
        applicationNumber: string,
        includeHistory: boolean = true,
        includeDocuments: boolean = true
    ): Promise<ApplicationStatus> {
        const params: StatusTrackingParams = {
            applicationNumber,
            includeHistory,
            includeDocuments,
        };

        const response = await apiService.get<ApplicationStatus>(
            "/applications/track",
            params
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Application not found");
        }

        return response.data;
    }

    /**
     * Track application status by application ID
     */
    async trackByApplicationId(
        applicationId: string,
        includeHistory: boolean = true,
        includeDocuments: boolean = true
    ): Promise<ApplicationStatus> {
        const params: StatusTrackingParams = {
            applicationId,
            includeHistory,
            includeDocuments,
        };

        const response = await apiService.get<ApplicationStatus>(
            `/applications/${applicationId}/status`,
            params
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Application not found");
        }

        return response.data;
    }

    /**
     * Get all applications with status for the current user
     */
    async getUserApplicationStatuses(params?: {
        status?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        dateFrom?: string;
        dateTo?: string;
    }): Promise<{
        applications: ApplicationStatus[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
        summary: {
            total: number;
            byStatus: Record<string, number>;
            averageProcessingTime: number;
        };
    }> {
        const response = await apiService.get<{
            applications: ApplicationStatus[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                pages: number;
            };
            summary: {
                total: number;
                byStatus: Record<string, number>;
                averageProcessingTime: number;
            };
        }>("/applications/status/user", params);

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to fetch application statuses"
            );
        }

        return response.data;
    }

    /**
     * Update application status (admin/reviewer only)
     */
    async updateApplicationStatus(
        applicationId: string,
        status: ApplicationStatus["status"],
        comments?: string
    ): Promise<ApplicationStatus> {
        const response = await apiService.put<ApplicationStatus>(
            `/applications/${applicationId}/status`,
            {
                status,
                comments,
            }
        );

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to update application status"
            );
        }

        return response.data;
    }

    /**
     * Bulk update application statuses (admin only)
     */
    async bulkUpdateStatuses(
        updates: BulkStatusUpdate
    ): Promise<{ updated: number; failed: number }> {
        if (updates.applicationIds.length === 0) {
            throw new Error("No applications selected for update");
        }

        const response = await apiService.put<{
            updated: number;
            failed: number;
        }>("/applications/status/bulk", updates);

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to update application statuses"
            );
        }

        return response.data;
    }

    /**
     * Add comment to application
     */
    async addComment(applicationId: string, comment: string): Promise<void> {
        if (!comment.trim()) {
            throw new Error("Comment cannot be empty");
        }

        const response = await apiService.post(
            `/applications/${applicationId}/comments`,
            {
                comment: comment.trim(),
            }
        );

        if (!response.success) {
            throw new Error(response.message || "Failed to add comment");
        }
    }

    /**
     * Request clarification on application
     */
    async requestClarification(
        applicationId: string,
        clarificationDetails: string
    ): Promise<void> {
        if (!clarificationDetails.trim()) {
            throw new Error("Clarification details are required");
        }

        const response = await apiService.post(
            `/applications/${applicationId}/clarification`,
            {
                details: clarificationDetails.trim(),
            }
        );

        if (!response.success) {
            throw new Error(
                response.message || "Failed to request clarification"
            );
        }
    }

    /**
     * Provide clarification response (applicant only)
     */
    async provideClarification(
        applicationId: string,
        response: string,
        documents?: File[]
    ): Promise<void> {
        if (!response.trim()) {
            throw new Error("Clarification response is required");
        }

        const formData = new FormData();
        formData.append("response", response.trim());

        if (documents && documents.length > 0) {
            documents.forEach((doc, index) => {
                formData.append(`documents[${index}]`, doc);
            });
        }

        const apiResponse = await apiService.uploadFile(
            `/applications/${applicationId}/clarification/response`,
            formData
        );

        if (!apiResponse.success) {
            throw new Error(
                apiResponse.message || "Failed to provide clarification"
            );
        }
    }

    /**
     * Get status progression steps
     */
    getStatusProgression(): Array<{
        status: ApplicationStatus["status"];
        title: string;
        description: string;
        icon: string;
        color: string;
    }> {
        return [
            {
                status: "submitted",
                title: "Submitted",
                description: "Application has been submitted for review",
                icon: "📝",
                color: "blue",
            },
            {
                status: "under_review",
                title: "Under Review",
                description:
                    "Application is being reviewed by the relevant authority",
                icon: "🔍",
                color: "yellow",
            },
            {
                status: "clarification_required",
                title: "Clarification Required",
                description: "Additional information or documents are needed",
                icon: "❓",
                color: "orange",
            },
            {
                status: "approved",
                title: "Approved",
                description: "Application has been approved for reimbursement",
                icon: "✅",
                color: "green",
            },
            {
                status: "rejected",
                title: "Rejected",
                description: "Application has been rejected",
                icon: "❌",
                color: "red",
            },
        ];
    }

    /**
     * Get status color
     */
    getStatusColor(status: ApplicationStatus["status"]): string {
        const colors: Record<ApplicationStatus["status"], string> = {
            draft: "gray",
            submitted: "blue",
            under_review: "yellow",
            clarification_required: "orange",
            approved: "green",
            rejected: "red",
        };

        return colors[status] || "gray";
    }

    /**
     * Get status icon
     */
    getStatusIcon(status: ApplicationStatus["status"]): string {
        const icons: Record<ApplicationStatus["status"], string> = {
            draft: "📄",
            submitted: "📝",
            under_review: "🔍",
            clarification_required: "❓",
            approved: "✅",
            rejected: "❌",
        };

        return icons[status] || "📄";
    }

    /**
     * Get status badge class
     */
    getStatusBadgeClass(status: ApplicationStatus["status"]): string {
        const classes: Record<ApplicationStatus["status"], string> = {
            draft: "bg-gray-100 text-gray-800 border-gray-200",
            submitted: "bg-blue-100 text-blue-800 border-blue-200",
            under_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
            clarification_required:
                "bg-orange-100 text-orange-800 border-orange-200",
            approved: "bg-green-100 text-green-800 border-green-200",
            rejected: "bg-red-100 text-red-800 border-red-200",
        };

        return `px-3 py-1 rounded-full text-sm font-medium border ${
            classes[status] || classes.draft
        }`;
    }

    /**
     * Calculate processing time
     */
    calculateProcessingTime(
        submittedAt: string,
        reviewedAt?: string
    ): number | null {
        if (!reviewedAt) return null;

        const submitted = new Date(submittedAt);
        const reviewed = new Date(reviewedAt);
        const diffInMs = reviewed.getTime() - submitted.getTime();
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

        return diffInDays;
    }

    /**
     * Get estimated processing time
     */
    getEstimatedProcessingTime(treatmentType: string): number {
        // Estimated processing times in days based on treatment type
        const estimatedTimes: Record<string, number> = {
            outpatient: 7,
            inpatient: 14,
            emergency: 3,
            specialty: 10,
            diagnostic: 5,
            preventive: 7,
            dental: 7,
            eye_care: 7,
            maternity: 14,
            surgery: 21,
        };

        return estimatedTimes[treatmentType.toLowerCase()] || 10;
    }

    /**
     * Check if status allows user action
     */
    canUserTakeAction(
        status: ApplicationStatus["status"],
        userRole: string
    ): boolean {
        if (userRole === "employee") {
            return status === "clarification_required" || status === "draft";
        }

        if (
            userRole === "health_centre" ||
            userRole === "obc" ||
            userRole === "super_admin"
        ) {
            return status === "submitted" || status === "under_review";
        }

        return false;
    }

    /**
     * Get next possible actions
     */
    getNextActions(
        status: ApplicationStatus["status"],
        userRole: string
    ): Array<{
        action: string;
        label: string;
        color: string;
        requiresComment: boolean;
    }> {
        const actions: Array<{
            action: string;
            label: string;
            color: string;
            requiresComment: boolean;
        }> = [];

        if (userRole === "employee") {
            if (status === "clarification_required") {
                actions.push({
                    action: "provide_clarification",
                    label: "Provide Clarification",
                    color: "blue",
                    requiresComment: true,
                });
            }
            if (status === "draft") {
                actions.push({
                    action: "submit",
                    label: "Submit Application",
                    color: "green",
                    requiresComment: false,
                });
            }
        } else if (["health_centre", "obc", "super_admin"].includes(userRole)) {
            if (status === "submitted") {
                actions.push({
                    action: "review",
                    label: "Start Review",
                    color: "yellow",
                    requiresComment: false,
                });
            }
            if (status === "under_review") {
                actions.push(
                    {
                        action: "approve",
                        label: "Approve",
                        color: "green",
                        requiresComment: false,
                    },
                    {
                        action: "reject",
                        label: "Reject",
                        color: "red",
                        requiresComment: true,
                    },
                    {
                        action: "request_clarification",
                        label: "Request Clarification",
                        color: "orange",
                        requiresComment: true,
                    }
                );
            }
        }

        return actions;
    }

    /**
     * Format status history for display
     */
    formatStatusHistory(history: ApplicationStatus["statusHistory"]): Array<{
        id: string;
        status: string;
        timestamp: string;
        relativeTime: string;
        user: string;
        comments?: string;
        actionTaken?: string;
        icon: string;
        color: string;
    }> {
        return history.map((entry) => ({
            id: entry.id,
            status: userService.getStatusDisplayName(entry.status as any),
            timestamp: userService.formatDateTime(entry.updatedAt),
            relativeTime: userService.getRelativeTime(entry.updatedAt),
            user: entry.updatedBy,
            comments: entry.comments,
            actionTaken: entry.actionTaken,
            icon: this.getStatusIcon(entry.status as any),
            color: this.getStatusColor(entry.status as any),
        }));
    }

    /**
     * Export status report
     */
    async exportStatusReport(params?: {
        format?: "pdf" | "csv" | "excel";
        applicationIds?: string[];
        dateFrom?: string;
        dateTo?: string;
    }): Promise<Blob> {
        const queryParams = new URLSearchParams();

        if (params?.format) queryParams.append("format", params.format);
        if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
        if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
        if (params?.applicationIds?.length) {
            params.applicationIds.forEach((id) =>
                queryParams.append("applicationIds", id)
            );
        }

        const response = await apiService.getBlob(
            `/applications/status/export?${queryParams.toString()}`
        );

        if (!response.ok) {
            throw new Error("Failed to export status report");
        }

        return response.blob();
    }

    /**
     * Download status report
     */
    downloadStatusReport(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
    }
}

// Create and export singleton instance
export const statusTrackerService = new StatusTrackerService();

// Export class for testing or custom instances
export { StatusTrackerService };
