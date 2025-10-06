import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'obc' | 'health-centre' | 'super-admin' | 'admin' | 'employee' | 'medical_officer' | 'super_admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Map backend roles to frontend roles
const mapRole = (backendRole: string): User['role'] => {
  const roleMap: Record<string, User['role']> = {
    'admin': 'obc',
    'medical_officer': 'health-centre',
    'super_admin': 'super-admin',
    'obc': 'obc',
    'health-centre': 'health-centre',
    'employee': 'employee'
  };
  return roleMap[backendRole] || 'employee';
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = authService.getStoredUser();
        if (currentUser && authService.isAuthenticated()) {
          setUser({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: mapRole(currentUser.role)
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      setLoading(true);
      // Use email field for username
      const authResponse = await authService.login({
        email: credentials.username,
        password: credentials.password
      });

      const mappedUser: User = {
        id: authResponse.user.id,
        name: authResponse.user.name,
        email: authResponse.user.email,
        role: mapRole(authResponse.user.role)
      };

      setUser(mappedUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};