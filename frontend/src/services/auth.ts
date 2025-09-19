// Authentication service
import { apiService } from "./api";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    employeeId?: string;
    department?: string;
    designation?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: "employee" | "admin" | "super_admin" | "medical_officer";
    employeeId?: string;
    department?: string;
    designation?: string;
    isActive: boolean;
    lastLogin?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken?: string;
    expiresIn: string;
}

class AuthService {
    private tokenKey = "authToken";
    private refreshTokenKey = "refreshToken";
    private userKey = "currentUser";

    /**
     * Login user
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>(
            "/auth/login",
            credentials
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Login failed");
        }

        // Store tokens and user data
        this.setAuthData(response.data);

        return response.data;
    }

    /**
     * Register new user
     */
    async register(userData: RegisterData): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>(
            "/auth/register",
            userData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Registration failed");
        }

        // Store tokens and user data
        this.setAuthData(response.data);

        return response.data;
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            await apiService.post("/auth/logout");
        } catch (error) {
            // Continue with logout even if API call fails
            console.warn("Logout API call failed:", error);
        }

        // Clear local storage
        this.clearAuthData();
    }

    /**
     * Get current user profile
     */
    async getCurrentUser(): Promise<User> {
        const response = await apiService.get<User>("/auth/me");

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch user profile");
        }

        // Update stored user data
        localStorage.setItem(this.userKey, JSON.stringify(response.data));

        return response.data;
    }

    /**
     * Refresh authentication token
     */
    async refreshToken(): Promise<AuthResponse> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await apiService.post<AuthResponse>("/auth/refresh", {
            refreshToken,
        });

        if (!response.success || !response.data) {
            // Refresh failed, clear auth data
            this.clearAuthData();
            throw new Error(response.message || "Token refresh failed");
        }

        // Update stored tokens
        this.setAuthData(response.data);

        return response.data;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = this.getToken();
        const user = this.getStoredUser();

        if (!token || !user) {
            return false;
        }

        // TODO: Add token expiration check
        return true;
    }

    /**
     * Get stored authentication token
     */
    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Get stored refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey);
    }

    /**
     * Get stored user data
     */
    getStoredUser(): User | null {
        const userData = localStorage.getItem(this.userKey);
        if (!userData) return null;

        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error("Failed to parse stored user data:", error);
            return null;
        }
    }

    /**
     * Store authentication data
     */
    private setAuthData(authData: AuthResponse): void {
        localStorage.setItem(this.tokenKey, authData.token);
        localStorage.setItem(this.userKey, JSON.stringify(authData.user));

        if (authData.refreshToken) {
            localStorage.setItem(this.refreshTokenKey, authData.refreshToken);
        }
    }

    /**
     * Clear all authentication data
     */
    private clearAuthData(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
    }

    /**
     * Check if user has specific role
     */
    hasRole(role: User["role"]): boolean {
        const user = this.getStoredUser();
        return user?.role === role;
    }

    /**
     * Check if user is admin (admin, super_admin, or medical_officer)
     */
    isAdmin(): boolean {
        const user = this.getStoredUser();
        return ["admin", "super_admin", "medical_officer"].includes(
            user?.role || ""
        );
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData: Partial<RegisterData>): Promise<User> {
        const response = await apiService.put<User>(
            "/users/profile",
            profileData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to update profile");
        }

        // Update stored user data
        localStorage.setItem(this.userKey, JSON.stringify(response.data));

        return response.data;
    }
}

// Create and export singleton instance
export const authService = new AuthService();

// Export class for testing or custom instances
export { AuthService };
