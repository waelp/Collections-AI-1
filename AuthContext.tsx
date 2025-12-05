import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export type UserRole = 'admin' | 'collector' | 'viewer';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('collections_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      localStorage.setItem('collections_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('collections_auth_user');
    }
  }, [user]);

  const login = (email: string, role: UserRole) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      role,
    };
    setUser(newUser);
    setLocation('/');
  };

  const logout = () => {
    setUser(null);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
