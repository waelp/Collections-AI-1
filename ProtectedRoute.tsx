import React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  allowedRoles?: UserRole[];
  [key: string]: any;
}

export function ProtectedRoute({ component: Component, allowedRoles, ...rest }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return <Component {...rest} />;
}
