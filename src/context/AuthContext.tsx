import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api, authStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  quickLoginAs: (role: 'Admin' | 'Staff') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authStorage.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const token = authStorage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setUser(res.user);
        authStorage.setUser(res.user);
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        authStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'Staff') => {
    setIsLoading(true);
    try {
      const res = await api.register({ name, email, password, role });
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const quickLoginAs = async (targetRole: 'Admin' | 'Staff') => {
    if (targetRole === 'Admin') {
      await login('admin@stockms.com', 'admin123');
    } else {
      await login('staff@stockms.com', 'staff123');
    }
  };

  const role = user?.role || null;
  const isAdmin = role === 'Admin';
  const isStaff = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isStaff,
        isLoading,
        login,
        register,
        logout,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
