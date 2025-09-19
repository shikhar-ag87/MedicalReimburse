import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  role: 'obc' | 'health-centre' | 'super-admin';
}

interface AuthContextType {
  user: User | null;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: { username: string; password: string }) => {
    // Simulate authentication
    const { username, password } = credentials;
    
    // Mock users for demo
    const mockUsers: Record<string, User> = {
      'obc_admin': { id: '1', name: 'OBC Administrator', role: 'obc' },
      'health_admin': { id: '2', name: 'Health Centre Admin', role: 'health-centre' },
      'super_admin': { id: '3', name: 'Super Administrator', role: 'super-admin' }
    };

    if (mockUsers[username] && password === 'password') {
      setUser(mockUsers[username]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};