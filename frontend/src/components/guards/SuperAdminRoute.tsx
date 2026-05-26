import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Gate for SUPER_ADMIN-only pages (the Companies management view). Mount
 * inside <ProtectedRoute> so isLoading is already resolved by the time we
 * check the role.
 */
export function SuperAdminRoute() {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
