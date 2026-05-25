import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { formatCurrency } from '../../lib/format';
import { budgetService } from '../../api/services/budgetService';
import type { BudgetResponse } from '../../types';

type Tone = 'danger' | 'warning' | 'success';

interface ToneStyle {
  iconBg: string;
  iconFg: string;
  bar: string;
  amount: string;
  Icon: LucideIcon;
}

const TONE_STYLE: Record<Tone, ToneStyle> = {
  danger:  { iconBg: 'rgba(239, 68, 68, 0.13)',  iconFg: '#EF4444', bar: '#EF4444', amount: '#EF4444', Icon: AlertCircle   },
  warning: { iconBg: 'rgba(245, 158, 11, 0.13)', iconFg: '#F59E0B', bar: '#F59E0B', amount: '#F59E0B', Icon: AlertTriangle },
  success: { iconBg: 'rgba(16, 185, 129, 0.13)', iconFg: '#10B981', bar: '#10B981', amount: '#10B981', Icon: CheckCircle2  },
};

function toneFor(b: BudgetResponse): Tone {
  if (b.isOverBudget || b.percentageUsed >= 85) return 'danger';
  if (b.isNearLimit || b.percentageUsed >= 60) return 'warning';
  return 'success';
}

function AlertRow({ budget }: { budget: BudgetResponse }) {
  const t = TONE_STYLE[toneFor(budget)];
  const Icon = t.Icon;
  const spent = Number(budget.spent);
  const limit = Number(budget.monthlyLimit);
  // Cap the bar at 100% even if the spend went over, so the bar can't overflow.
  const barWidth = Math.min(100, Math.max(0, budget.percentageUsed));
  const pctLabel = Math.round(budget.percentageUsed);

  return (
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: t.iconBg, color: t.iconFg }}
        aria-hidden="true"
      >
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">
            {budget.categoryName}
          </div>
          <div className="text-[12.5px] tnum whitespace-nowrap">
            <span className="font-semibold" style={{ color: t.amount }}>{formatCurrency(spent)}</span>
            <span className="text-text-muted dark:text-[#94A3B8]"> / </span>
            <span className="text-text-muted dark:text-[#94A3B8]">{formatCurrency(limit)}</span>
          </div>
        </div>
        <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">
          {pctLabel}% of budget used
        </div>
        <div className="mt-2 h-[5px] rounded-full bg-surface-muted dark:bg-[#121B32] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${barWidth}%`,
              background: t.bar,
              boxShadow: `0 0 12px ${t.bar}55`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="w-9 h-9 rounded-lg shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="h-3 w-24 mt-1.5" />
        <Skeleton className="h-1.5 w-full mt-2 rounded-full" />
      </div>
    </div>
  );
}

const TOP_N = 4; // most-used budgets shown first; tweak if the card needs to fit more/fewer rows

export function BudgetAlerts() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getBudgets,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    // Sort by percentage used DESC — most pressing budgets surface first.
    return [...data]
      .sort((a, b) => b.percentageUsed - a.percentageUsed)
      .slice(0, TOP_N);
  }, [data]);

  return (
    <div className="fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-5 sm:p-6 shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">Budget Alerts</h3>
        <Link
          to="/budgets"
          className="text-[12.5px] font-semibold text-accent hover:opacity-80 inline-flex items-center gap-1 transition"
        >
          View All <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {isLoading && (
        <div className="flex-1 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <LoadingRow key={i} />)}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load budgets"
          description="Refresh to try again."
        />
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          icon={PieChart}
          title="No budgets set"
          description="Create a budget to see spend alerts here."
        />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <div className="flex-1 flex flex-col gap-4">
          {rows.map((b) => (
            <AlertRow key={b.id} budget={b} />
          ))}
        </div>
      )}
    </div>
  );
}
