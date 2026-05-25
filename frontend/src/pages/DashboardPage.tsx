import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';

import { DateRangePill } from '../components/ui/DateRangePill';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { SpendingChart } from '../components/dashboard/SpendingChart';
import { TrendChart } from '../components/dashboard/TrendChart';
import { RecentExpenses } from '../components/dashboard/RecentExpenses';
import { BudgetAlerts } from '../components/dashboard/BudgetAlerts';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { dashboardService } from '../api/services/dashboardService';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const summary    = useQuery({ queryKey: ['dashboard', 'summary'],     queryFn: dashboardService.getSummary });
  const trends     = useQuery({ queryKey: ['dashboard', 'trends'],      queryFn: () => dashboardService.getTrends() });
  const byCategory = useQuery({ queryKey: ['dashboard', 'by-category'], queryFn: () => dashboardService.getByCategory() });
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
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5">
      {/* Greeting + date range */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
            Dashboard
          </h1>
          <p className="text-[13px] sm:text-[13.5px] text-text-muted dark:text-[#94A3B8] mt-1">
            {user
              ? `Welcome back, ${user.fullName}! Here's your financial overview.`
              : "Here's your financial overview."}
          </p>
        </div>
        <DateRangePill />
      </div>

      {allFailed ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-10 shadow-card flex flex-col items-center text-center">
          <AlertTriangle size={28} className="text-danger" aria-hidden="true" />
          <p className="mt-3 font-semibold text-text-primary dark:text-[#F5F7FF]">Failed to load dashboard</p>
          <p className="text-[13.5px] text-text-muted dark:text-[#94A3B8] mt-1">Check your connection and try again.</p>
          <button
            type="button"
            onClick={retryAll}
            className="mt-5 px-5 h-10 rounded-xl text-[13px] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(91,92,240,0.7)]"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <SummaryCards />

          {/* Trend (wider) + Donut */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-4 sm:gap-5">
            <TrendChart />
            <SpendingChart />
          </div>

          {/* Row 1: Recent Expenses + Budget Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 sm:gap-5">
            <RecentExpenses />
            <BudgetAlerts />
          </div>

          {/* Row 2: Recent Activity (full width) — audit-log endpoint is ADMIN-only */}
          {isAdmin && <ActivityFeed />}

          <div className="h-2" />
        </>
      )}
    </div>
  );
}
