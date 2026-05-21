import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Mount INSIDE <ProtectedRoute> so isLoading is already resolved here.
 * Only checks role.
 */
export function AdminRoute() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
