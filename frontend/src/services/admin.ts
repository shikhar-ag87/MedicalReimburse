// Admin service for managing applications and users
import { apiService } from "./api";
import type { Application } from "./applications";
import type { User } from "./auth";

export interface DashboardStats {
    applications: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        completed: number;
        underReviewCount: number;
        pendingCount: number;
        recentApplications: Application[];
    };
    users: {
        total: number;
        admins: number;
        employees: number;
        medicalOfficers: number;
        recentUsers: User[];
    };
    system: {
        serverUptime: number;
        nodeVersion: string;
        environment: string;
        lastUpdated: string;
    };
}

export interface ApplicationReviewSummary {
    totalReviews: number;
    lastDecision?: string;
    lastReviewedAt?: string;
}

export interface AdminApplication extends Application {
    expenseCount: number;
    documentCount: number;
    totalExpenseClaimed: number;
    totalExpensePassed: number;
    reviewSummary?: ApplicationReviewSummary;
}

export interface SystemSettings {
    application: {
        name: string;
        version: string;
        environment: string;
    };
    database: {
        type: string;
        connected: boolean;
    };
    security: {
        jwtExpiresIn: string;
        rateLimitWindowMs: string;
        rateLimitMax: string;
    };
    features: {
        fileUploadEnabled: boolean;
        emailNotificationsEnabled: boolean;
        auditLoggingEnabled: boolean;
    };
    server: {
        port: string;
        cors: {
            allowedOrigins: string[];
        };
        uptime: number;
        memory: any;
        nodeVersion: string;
    };
}

export interface AuditLog {
    id: string;
    entityType: "application" | "user" | "document";
    entityId: string;
    action: "create" | "update" | "delete" | "view" | "approve" | "reject";
    userId: string;
    userEmail: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
}

class AdminService {
    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await apiService.get<DashboardStats>(
            "/admin/dashboard"
        );

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to fetch dashboard stats"
            );
        }

        return response.data;
    }

    /**
     * Get all applications for admin review
     */
    async getAllApplications(params?: {
        status?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }): Promise<{
        applications: AdminApplication[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        filters: {
            status?: string;
            sortBy: string;
            sortOrder: string;
        };
    }> {
        const response = await apiService.get("/admin/applications", params);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch applications");
        }

        // Return data with proper structure and type assertion
        const data = response.data as any;
        return {
            applications: data.applications || [],
            pagination: data.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            },
            filters: data.filters || {
                sortBy: "submittedAt",
                sortOrder: "desc",
            },
        };
    }

    /**
     * Get all users for admin management
     */
    async getAllUsers(params?: {
        role?: string;
        page?: number;
        limit?: number;
        active?: boolean;
    }): Promise<{
        users: User[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        filters: {
            role?: string;
            active?: boolean;
        };
    }> {
        const response = await apiService.get("/admin/users", params);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch users");
        }

        // Return data with proper structure and type assertion
        const data = response.data as any;
        return {
            users: data.users || [],
            pagination: data.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            },
            filters: data.filters || {
                role: undefined,
                active: undefined,
            },
        };
    }

    /**
     * Update user status (activate/deactivate)
     */
    async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
        const response = await apiService.patch(
            `/admin/users/${userId}/status`,
            {
                isActive,
            }
        );

        if (!response.success) {
            throw new Error(response.message || "Failed to update user status");
        }
    }

    /**
     * Update application status
     */
    async updateApplicationStatus(
        applicationId: string,
        status: Application["status"],
        comments?: string,
        amountPassed?: number
    ): Promise<void> {
        const response = await apiService.patch(
            `/applications/${applicationId}/status`,
            {
                status,
                comments,
                amountPassed,
            }
        );

        if (!response.success) {
            throw new Error(
                response.message || "Failed to update application status"
            );
        }
    }

    /**
     * Get system settings
     */
    async getSystemSettings(): Promise<SystemSettings> {
        const response = await apiService.get<SystemSettings>(
            "/admin/settings"
        );

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to fetch system settings"
            );
        }

        return response.data;
    }

    /**
     * Get audit logs (super admin only)
     */
    async getAuditLogs(params?: {
        entityType?: string;
        entityId?: string;
        userId?: string;
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        logs: AuditLog[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        filters: any;
    }> {
        const response = await apiService.get("/admin/audit-logs", params);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch audit logs");
        }

        // Return data with proper structure and type assertion
        const data = response.data as any;
        return {
            logs: data.logs || [],
            pagination: data.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            },
            filters: data.filters || {},
        };
    }

    /**
     * Export application data (super admin only)
     */
    async exportApplications(params?: {
        format?: "json" | "csv";
        startDate?: string;
        endDate?: string;
        status?: string;
    }): Promise<any> {
        const response = await apiService.get(
            "/admin/export/applications",
            params
        );

        if (!response.success) {
            throw new Error(
                response.message || "Failed to export applications"
            );
        }

        return response.data;
    }

    /**
     * Bulk approve applications
     */
    async bulkApproveApplications(
        applicationIds: string[],
        comments?: string
    ): Promise<void> {
        const promises = applicationIds.map((id) =>
            this.updateApplicationStatus(id, "approved", comments)
        );

        try {
            await Promise.all(promises);
        } catch (error) {
            throw new Error(
                "Some applications failed to update. Please check individual statuses."
            );
        }
    }

    /**
     * Bulk reject applications
     */
    async bulkRejectApplications(
        applicationIds: string[],
        reason: string
    ): Promise<void> {
        const promises = applicationIds.map((id) =>
            this.updateApplicationStatus(id, "rejected", reason)
        );

        try {
            await Promise.all(promises);
        } catch (error) {
            throw new Error(
                "Some applications failed to update. Please check individual statuses."
            );
        }
    }

    /**
     * Get application statistics by date range
     */
    async getApplicationStatsbyDateRange(
        startDate: string,
        endDate: string
    ): Promise<{
        totalApplications: number;
        totalAmountClaimed: number;
        totalAmountPassed: number;
        statusBreakdown: Record<string, number>;
        dailyStats: Array<{
            date: string;
            applications: number;
            amountClaimed: number;
            amountPassed: number;
        }>;
    }> {
        // This would typically be a specific endpoint, but for now we'll use the export functionality
        const exportData = await this.exportApplications({
            format: "json",
            startDate,
            endDate,
        });

        const applications = exportData.applications || [];

        // Calculate statistics
        const totalAmountClaimed = applications.reduce(
            (sum: number, app: any) => sum + (app.totalAmountClaimed || 0),
            0
        );
        const totalAmountPassed = applications.reduce(
            (sum: number, app: any) => sum + (app.totalAmountPassed || 0),
            0
        );

        const statusBreakdown = applications.reduce(
            (acc: Record<string, number>, app: any) => {
                acc[app.status] = (acc[app.status] || 0) + 1;
                return acc;
            },
            {}
        );

        // Group by date for daily stats
        const dailyStats: Record<string, any> = {};
        applications.forEach((app: any) => {
            const date = new Date(app.submittedAt).toISOString().split("T")[0];
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    applications: 0,
                    amountClaimed: 0,
                    amountPassed: 0,
                };
            }
            dailyStats[date].applications += 1;
            dailyStats[date].amountClaimed += app.totalAmountClaimed || 0;
            dailyStats[date].amountPassed += app.totalAmountPassed || 0;
        });

        return {
            totalApplications: applications.length,
            totalAmountClaimed,
            totalAmountPassed,
            statusBreakdown,
            dailyStats: Object.values(dailyStats),
        };
    }
}

// Create and export singleton instance
export const adminService = new AdminService();

// Export class for testing or custom instances
export { AdminService };
