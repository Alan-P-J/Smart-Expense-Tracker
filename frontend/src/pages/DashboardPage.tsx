import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { AppCard } from '../components/ui/AppCard';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { SpendingChart } from '../components/dashboard/SpendingChart';
import { TrendChart } from '../components/dashboard/TrendChart';
import { RecentExpenses } from '../components/dashboard/RecentExpenses';
import { dashboardService } from '../api/services/dashboardService';
import { useAuth } from '../hooks/useAuth';

/**
 * The four child widgets each call useQuery with their own key. We mirror
 * those calls here purely to inspect state for the page-level "all errored"
 * fallback. React Query dedupes by queryKey, so this doesn't trigger extra
 * network requests — the children re-use the same cached entries.
 */
export function DashboardPage() {
  const { user } = useAuth();

  const summary    = useQuery({ queryKey: ['dashboard', 'summary'],     queryFn: dashboardService.getSummary });
  const trends     = useQuery({ queryKey: ['dashboard', 'trends'],      queryFn: dashboardService.getTrends });
  const byCategory = useQuery({ queryKey: ['dashboard', 'by-category'], queryFn: dashboardService.getByCategory });
  const recent     = useQuery({ queryKey: ['dashboard', 'recent'],      queryFn: dashboardService.getRecent });

  const allFailed =
    summary.isError && trends.isError && byCategory.isError && recent.isError;

  const retryAll = () => {
    summary.refetch();
    trends.refetch();
    byCategory.refetch();
    recent.refetch();
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={user ? `Welcome back, ${user.fullName}` : undefined}
      />

      {allFailed ? (
        <AppCard className="flex flex-col items-center text-center py-8">
          <AlertTriangle size={24} className="text-danger" aria-hidden="true" />
          <p className="mt-3 font-medium text-text-primary dark:text-text-dark-primary">
            Failed to load dashboard
          </p>
          <p className="text-sm text-text-muted dark:text-text-dark-muted mt-1">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={retryAll}
            className={
              'mt-4 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium ' +
              'hover:bg-primary hover:text-white ' +
              'active:scale-[0.98] transition-all duration-200 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            }
          >
            Retry
          </button>
        </AppCard>
      ) : (
        <div className="space-y-6">
          <SummaryCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart />
            <SpendingChart />
          </div>

          <RecentExpenses />
        </div>
      )}
    </>
  );
}
