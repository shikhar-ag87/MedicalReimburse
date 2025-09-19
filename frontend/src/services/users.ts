// User service for profile management and account operations
import { apiService } from "./api";

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    role: "employee" | "health_centre" | "obc" | "super_admin";
    fullName: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    phoneNumber?: string;
    address?: string;
    emergencyContact?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
}

export interface UpdateProfileRequest {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    emergencyContact?: string;
    department?: string;
    designation?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UserStats {
    totalApplications: number;
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    totalReimbursedAmount: number;
    averageProcessingTime: number; // in days
}

export interface UserApplication {
    id: string;
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
    totalAmount: number;
    treatmentType: string;
    patientName: string;
    lastUpdated: string;
}

class UserService {
    /**
     * Get current user profile
     */
    async getProfile(): Promise<UserProfile> {
        const response = await apiService.get<UserProfile>("/users/profile");

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch user profile");
        }

        return response.data;
    }

    /**
     * Update user profile
     */
    async updateProfile(
        profileData: UpdateProfileRequest
    ): Promise<UserProfile> {
        const response = await apiService.put<UserProfile>(
            "/users/profile",
            profileData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to update profile");
        }

        return response.data;
    }

    /**
     * Change user password
     */
    async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            throw new Error("New password and confirmation do not match");
        }

        if (passwordData.newPassword.length < 8) {
            throw new Error("Password must be at least 8 characters long");
        }

        const response = await apiService.put("/users/change-password", {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        });

        if (!response.success) {
            throw new Error(response.message || "Failed to change password");
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats(): Promise<UserStats> {
        const response = await apiService.get<UserStats>("/users/stats");

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to fetch user statistics"
            );
        }

        return response.data;
    }

    /**
     * Get user applications with optional filtering
     */
    async getUserApplications(params?: {
        status?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        dateFrom?: string;
        dateTo?: string;
    }): Promise<{
        applications: UserApplication[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }> {
        const response = await apiService.get<{
            applications: UserApplication[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                pages: number;
            };
        }>("/users/applications", params);

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to fetch user applications"
            );
        }

        return response.data;
    }

    /**
     * Deactivate user account
     */
    async deactivateAccount(): Promise<void> {
        const response = await apiService.put("/users/deactivate");

        if (!response.success) {
            throw new Error(response.message || "Failed to deactivate account");
        }
    }

    /**
     * Upload profile picture
     */
    async uploadProfilePicture(
        file: File
    ): Promise<{ profilePictureUrl: string }> {
        // Validate file
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
        ];

        if (file.size > maxSize) {
            throw new Error("Profile picture must be smaller than 5MB");
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error("Only JPEG, PNG, and GIF images are allowed");
        }

        const formData = new FormData();
        formData.append("profilePicture", file);

        const response = await apiService.uploadFile<{
            profilePictureUrl: string;
        }>("/users/profile-picture", formData);

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to upload profile picture"
            );
        }

        return response.data;
    }

    /**
     * Validate password strength
     */
    validatePassword(password: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }

        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter");
        }

        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter");
        }

        if (!/\d/.test(password)) {
            errors.push("Password must contain at least one number");
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push("Password must contain at least one special character");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get user role display name
     */
    getRoleDisplayName(role: UserProfile["role"]): string {
        const roleNames: Record<UserProfile["role"], string> = {
            employee: "Employee",
            health_centre: "Health Centre",
            obc: "OBC Officer",
            super_admin: "Super Admin",
        };

        return roleNames[role] || role;
    }

    /**
     * Get status color for applications
     */
    getStatusColor(status: UserApplication["status"]): string {
        const statusColors: Record<UserApplication["status"], string> = {
            draft: "gray",
            submitted: "blue",
            under_review: "yellow",
            approved: "green",
            rejected: "red",
            clarification_required: "orange",
        };

        return statusColors[status] || "gray";
    }

    /**
     * Get status display name
     */
    getStatusDisplayName(status: UserApplication["status"]): string {
        const statusNames: Record<UserApplication["status"], string> = {
            draft: "Draft",
            submitted: "Submitted",
            under_review: "Under Review",
            approved: "Approved",
            rejected: "Rejected",
            clarification_required: "Clarification Required",
        };

        return statusNames[status] || status;
    }

    /**
     * Format currency amount
     */
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    /**
     * Format date
     */
    formatDate(date: string): string {
        return new Date(date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    /**
     * Format date and time
     */
    formatDateTime(date: string): string {
        return new Date(date).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    /**
     * Calculate relative time
     */
    getRelativeTime(date: string): string {
        const now = new Date();
        const targetDate = new Date(date);
        const diffInSeconds = Math.floor(
            (now.getTime() - targetDate.getTime()) / 1000
        );

        if (diffInSeconds < 60) {
            return "Just now";
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
        }

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) {
            return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
        }

        return this.formatDate(date);
    }

    /**
     * Export user data
     */
    async exportUserData(format: "json" | "csv" = "json"): Promise<Blob> {
        const response = await apiService.getBlob(
            `/users/export?format=${format}`
        );

        if (!response.ok) {
            throw new Error("Failed to export user data");
        }

        return response.blob();
    }

    /**
     * Download exported data
     */
    downloadExportedData(blob: Blob, filename: string): void {
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
export const userService = new UserService();

// Export class for testing or custom instances
export { UserService };
