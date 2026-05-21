import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Branded full-page loader while the /me probe is in-flight — prevents
  // a blank flash and a moment of the login page before auth resolves.
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen bg-surface-muted dark:bg-surface-dark-muted flex flex-col items-center justify-center gap-4 transition-colors duration-200"
      >
        <span className="text-primary text-xl font-semibold">ExpenseTrack</span>
        <LoadingSpinner size="lg" label="Loading your workspace…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
