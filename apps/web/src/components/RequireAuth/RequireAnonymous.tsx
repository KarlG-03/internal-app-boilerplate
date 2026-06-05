import { Navigate, Outlet } from 'react-router-dom';
import { defaultHomePath, useAuth } from '@/contexts/AuthContext';

export function RequireAnonymous() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={defaultHomePath()} replace />;
  }

  return <Outlet />;
}
