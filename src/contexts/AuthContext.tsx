import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '@/types';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const userData = await apiClient.getMe();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      await apiClient.login({ username, password });
      await checkAuth();
      
      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно авторизованы в системе",
      });
      
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка авторизации",
        description: error instanceof Error ? error.message : "Неверные учетные данные",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
      
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
    } catch (error) {
      // Even if logout request fails, clear local state
      setUser(null);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Произошла ошибка при выходе из системы",
      });
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const isAdmin = user?.role === UserRole.ADMIN;
  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};