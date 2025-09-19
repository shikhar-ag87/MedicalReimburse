// React hooks for authentication
import {
    useState,
    useEffect,
    useCallback,
    useContext,
    createContext,
    ReactNode,
} from "react";
import {
    authService,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserRole,
} from "../services/auth";

interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    fullName: string;
    employeeId?: string;
    department?: string;
    isActive: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<AuthResponse>;
    register: (data: RegisterRequest) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasRole: (role: UserRole | UserRole[]) => boolean;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // Check if user has specific role(s)
    const hasRole = useCallback(
        (role: UserRole | UserRole[]): boolean => {
            if (!user) return false;

            if (Array.isArray(role)) {
                return role.includes(user.role);
            }

            return user.role === role;
        },
        [user]
    );

    // Check if user has permission (role-based permissions)
    const hasPermission = useCallback(
        (permission: string): boolean => {
            if (!user) return false;

            // Define role-based permissions
            const permissions: Record<UserRole, string[]> = {
                employee: [
                    "view_own_applications",
                    "create_application",
                    "upload_documents",
                ],
                health_centre: [
                    "view_applications",
                    "review_applications",
                    "approve_preliminary",
                ],
                obc: [
                    "view_all_applications",
                    "approve_final",
                    "manage_users",
                    "generate_reports",
                ],
                super_admin: ["*"], // Super admin has all permissions
            };

            const userPermissions = permissions[user.role] || [];

            // Super admin has all permissions
            if (userPermissions.includes("*")) return true;

            return userPermissions.includes(permission);
        },
        [user]
    );

    // Load user from token on app start
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = authService.getToken();
                if (token) {
                    const profile = await authService.getProfile();
                    setUser(profile);
                }
            } catch (error) {
                console.error("Failed to load user profile:", error);
                authService.clearToken();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // Login function
    const login = useCallback(
        async (credentials: LoginRequest): Promise<AuthResponse> => {
            setIsLoading(true);
            try {
                const response = await authService.login(credentials);
                setUser(response.user);
                return response;
            } catch (error) {
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // Register function
    const register = useCallback(
        async (data: RegisterRequest): Promise<AuthResponse> => {
            setIsLoading(true);
            try {
                const response = await authService.register(data);
                setUser(response.user);
                return response;
            } catch (error) {
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // Logout function
    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    // Refresh user profile
    const refreshUser = useCallback(async (): Promise<void> => {
        if (!authService.getToken()) return;

        try {
            const profile = await authService.getProfile();
            setUser(profile);
        } catch (error) {
            console.error("Failed to refresh user profile:", error);
            // If profile fetch fails, user might be logged out
            setUser(null);
            authService.clearToken();
        }
    }, []);

    const contextValue: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        hasRole,
        hasPermission,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Hook for login functionality
export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    const loginUser = useCallback(
        async (credentials: LoginRequest) => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await login(credentials);
                return response;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Login failed";
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [login]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loginUser,
        isLoading,
        error,
        clearError,
    };
}

// Hook for registration functionality
export function useRegister() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { register } = useAuth();

    const registerUser = useCallback(
        async (data: RegisterRequest) => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await register(data);
                return response;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Registration failed";
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [register]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        registerUser,
        isLoading,
        error,
        clearError,
    };
}

// Hook for logout functionality
export function useLogout() {
    const [isLoading, setIsLoading] = useState(false);
    const { logout } = useAuth();

    const logoutUser = useCallback(async () => {
        setIsLoading(true);
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    return {
        logoutUser,
        isLoading,
    };
}

// Hook to require authentication
export function useRequireAuth(redirectTo: string = "/login") {
    const { isAuthenticated, isLoading } = useAuth();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            setShouldRedirect(true);
        }
    }, [isAuthenticated, isLoading]);

    return {
        isAuthenticated,
        isLoading,
        shouldRedirect,
        redirectTo,
    };
}

// Hook to require specific role
export function useRequireRole(
    role: UserRole | UserRole[],
    redirectTo: string = "/unauthorized"
) {
    const { hasRole, isAuthenticated, isLoading } = useAuth();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated && !hasRole(role)) {
            setShouldRedirect(true);
        }
    }, [hasRole, role, isAuthenticated, isLoading]);

    return {
        hasRole: hasRole(role),
        isAuthenticated,
        isLoading,
        shouldRedirect,
        redirectTo,
    };
}

// Hook to require permission
export function useRequirePermission(
    permission: string,
    redirectTo: string = "/unauthorized"
) {
    const { hasPermission, isAuthenticated, isLoading } = useAuth();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated && !hasPermission(permission)) {
            setShouldRedirect(true);
        }
    }, [hasPermission, permission, isAuthenticated, isLoading]);

    return {
        hasPermission: hasPermission(permission),
        isAuthenticated,
        isLoading,
        shouldRedirect,
        redirectTo,
    };
}
