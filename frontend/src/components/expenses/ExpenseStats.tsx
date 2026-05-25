import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Calendar, CreditCard, Wallet } from 'lucide-react';
import { useMemo } from 'react';

import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../lib/format';
import type { EnrichedExpense } from './enrichExpense';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon: LucideIcon;
  iconColor: string;
}

function StatCard({ label, value, sub, accent, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-4 sm:p-5 shadow-card flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-medium text-text-muted dark:text-[#94A3B8]">{label}</div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: iconColor + '1f', color: iconColor }}
          aria-hidden="true"
        >
          <Icon size={15} />
        </div>
      </div>
      <div className="text-[22px] font-bold text-text-primary dark:text-[#F5F7FF] tnum tracking-tight">{value}</div>
      {sub && <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8]">{sub}</div>}
      {accent && <div className="text-[11.5px] font-semibold text-success">{accent}</div>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-4 sm:p-5 shadow-card flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3.5 w-28" />
    </div>
  );
}

interface ExpenseStatsProps {
  rows: EnrichedExpense[];      // filtered
  allRows: EnrichedExpense[];   // full set
  isLoading?: boolean;
}

const GRID = 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4';

export function ExpenseStats({ rows, allRows, isLoading = false }: ExpenseStatsProps) {
  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const pending = allRows.filter((r) => r.status === 'Pending').length;
    const approved = allRows.filter((r) => r.status === 'Approved').length;
    const now = new Date();
    const thisMonth = allRows
      .filter((r) => r.date.getMonth() === now.getMonth() && r.date.getFullYear() === now.getFullYear())
      .reduce((s, r) => s + r.amount, 0);
    return { total, pending, approved, thisMonth, count: rows.length };
  }, [rows, allRows]);

  if (isLoading) {
    return (
      <div className={GRID}>
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className={GRID}>
      <StatCard
        label="Total expenses"
        value={formatCurrency(stats.total)}
        sub={`${stats.count} matching ${stats.count === 1 ? 'entry' : 'entries'}`}
        icon={Wallet}
        iconColor="#5B5CF0"
      />
      <StatCard
        label="This month"
        value={formatCurrency(stats.thisMonth)}
        sub={new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        accent="↑ 12.5% vs last month"
        icon={Calendar}
        iconColor="#38BDF8"
      />
      <StatCard
        label="Pending approval"
        value={stats.pending}
        sub={`${stats.approved} approved this month`}
        icon={AlertCircle}
        iconColor="#F59E0B"
      />
      <StatCard
        label="Avg per expense"
        value={stats.count > 0 ? formatCurrency(stats.total / stats.count) : '₹0'}
        sub="Across selection"
        icon={CreditCard}
        iconColor="#10B981"
      />
    </div>
  );
}
