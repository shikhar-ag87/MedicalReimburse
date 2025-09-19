// API Configuration and base utilities
const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
}

export interface ApiError {
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    stack?: string;
}

class ApiService {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const defaultHeaders = {
            "Content-Type": "application/json",
            Accept: "application/json",
        };

        // Add authorization header if token exists
        const token = localStorage.getItem("authToken");
        if (token) {
            (defaultHeaders as any)["Authorization"] = `Bearer ${token}`;
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            // Handle non-JSON responses
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Invalid response format: ${contentType}`);
            }

            const data = await response.json();

            if (!response.ok) {
                // Handle API error responses
                const error: ApiError = data.error || {
                    message: data.message || "An error occurred",
                    statusCode: response.status,
                    timestamp: new Date().toISOString(),
                    path: endpoint,
                };

                throw new Error(
                    `API Error ${error.statusCode}: ${error.message}`
                );
            }

            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);

            if (error instanceof Error) {
                throw error;
            }

            throw new Error(`Network error: ${String(error)}`);
        }
    }

    // GET request
    async get<T>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<ApiResponse<T>> {
        let url = endpoint;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const paramString = searchParams.toString();
            if (paramString) {
                url += `?${paramString}`;
            }
        }

        return this.request<T>(url, { method: "GET" });
    }

    // POST request
    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // PUT request
    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // PATCH request
    async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // DELETE request
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }

    // File upload with FormData
    async uploadFile<T>(
        endpoint: string,
        formData: FormData
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const headers: Record<string, string> = {};

        // Add authorization header if token exists
        const token = localStorage.getItem("authToken");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Don't set Content-Type for FormData - browser will set it with boundary

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                const error: ApiError = data.error || {
                    message: data.message || "File upload failed",
                    statusCode: response.status,
                    timestamp: new Date().toISOString(),
                    path: endpoint,
                };

                throw new Error(
                    `Upload Error ${error.statusCode}: ${error.message}`
                );
            }

            return data;
        } catch (error) {
            console.error(`File upload failed for ${endpoint}:`, error);

            if (error instanceof Error) {
                throw error;
            }

            throw new Error(`Upload error: ${String(error)}`);
        }
    }
}

// Create singleton instance
export const apiService = new ApiService();

// Export the class for custom instances
export { ApiService };

// Health check utility
export const checkServerHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(
            `${API_BASE_URL.replace("/api", "")}/health`
        );
        return response.ok;
    } catch (error) {
        console.error("Health check failed:", error);
        return false;
    }
};

// Utility to handle API errors in UI
export const handleApiError = (error: Error): string => {
    if (error.message.includes("401")) {
        // Unauthorized - redirect to login
        localStorage.removeItem("authToken");
        window.location.href = "/login";
        return "Session expired. Please login again.";
    }

    if (error.message.includes("403")) {
        return "Access denied. You do not have permission to perform this action.";
    }

    if (error.message.includes("404")) {
        return "Resource not found.";
    }

    if (error.message.includes("500")) {
        return "Server error. Please try again later.";
    }

    if (error.message.includes("Network error")) {
        return "Network error. Please check your connection and try again.";
    }

    return error.message || "An unexpected error occurred.";
};
