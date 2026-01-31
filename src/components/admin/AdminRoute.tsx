import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../config/adminEmails';
import type { ReactNode } from 'react';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin(user.email)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
