import { useQuery } from '@tanstack/react-query';
import { CreditCard, FileText, Gauge, Plus, Tag } from 'lucide-react';

import { SummaryCard } from './SummaryCard';
import { dashboardService } from '../../api/services/dashboardService';
import { budgetService } from '../../api/services/budgetService';
import { formatCurrency } from '../../lib/format';

const GRID = 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5';

/**
 * Sparklines on the KPI cards remain *visual* — the backend doesn't expose
 * per-day series for these metrics yet. The values, deltas, and progress %
 * are all real.
 */
function seriesFor(base: number, drift = 0.12, n = 14): number[] {
  const arr: number[] = [];
  let v = base * (1 - drift / 2);
  for (let i = 0; i < n; i++) {
    v *= 1 + ((Math.sin(i * 1.3 + base) + Math.cos(i * 0.7)) * 0.03) + (i / n) * (drift / n) * 4;
    arr.push(Math.round(v));
  }
  return arr;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function SummaryCards() {
  const summary = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardService.getSummary });
  const trends = useQuery({ queryKey: ['dashboard', 'trends'], queryFn: () => dashboardService.getTrends() });
  const budgets = useQuery({ queryKey: ['budgets'], queryFn: budgetService.getBudgets });

  const isLoading = summary.isLoading || budgets.isLoading;

  if (isLoading) {
    return (
      <div className={GRID}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SummaryCard
            key={i}
            isLoading
            title=""
            value=""
            icon={CreditCard}
            spark={[]}
            sparkColor="#5B5CF0"
            toneSoft="rgba(91, 92, 240, 0.14)"
            index={i}
          />
        ))}
      </div>
    );
  }

  // Real values
  const totalExpenses = Number(summary.data?.totalAmount ?? 0);
  const totalBudget = (budgets.data ?? []).reduce((s, b) => s + Number(b.monthlyLimit || 0), 0);
  const amountSpent = (budgets.data ?? []).reduce((s, b) => s + Number(b.spent || 0), 0);
  // Fall back to summary.totalAmount if no budgets exist so the spent card stays meaningful.
  const spent = totalBudget > 0 ? amountSpent : totalExpenses;
  const remaining = Math.max(totalBudget - spent, 0);
  const utilization = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  // Month-over-month deltas from the trend series — last entry is current month.
  const months = trends.data?.months ?? [];
  const currentMonthTotal = months.length ? Number(months[months.length - 1].total) : null;
  const previousMonthTotal = months.length >= 2 ? Number(months[months.length - 2].total) : null;
  const expensesDelta =
    currentMonthTotal != null && previousMonthTotal != null
      ? pctDelta(currentMonthTotal, previousMonthTotal)
      : null;

  return (
    <div className={GRID}>
      <SummaryCard
        title="Total Expenses"
        value={formatCurrency(totalExpenses)}
        icon={CreditCard}
        spark={seriesFor(Math.max(totalExpenses, 1000), 0.45)}
        sparkColor="#5B5CF0"
        toneSoft="rgba(91, 92, 240, 0.14)"
        trend={expensesDelta != null ? { value: expensesDelta, label: 'vs last month' } : undefined}
        index={0}
      />
      <SummaryCard
        title="Total Budget"
        value={formatCurrency(totalBudget)}
        icon={FileText}
        spark={seriesFor(Math.max(totalBudget, 1000), 0.3)}
        sparkColor="#38BDF8"
        toneSoft="rgba(56, 189, 248, 0.12)"
        index={1}
      />
      <SummaryCard
        title="Amount Spent"
        value={formatCurrency(spent)}
        icon={Plus}
        spark={seriesFor(Math.max(spent, 1000), 0.55)}
        sparkColor="#10B981"
        toneSoft="rgba(16, 185, 129, 0.12)"
        trend={expensesDelta != null ? { value: expensesDelta, label: 'vs last month' } : undefined}
        index={2}
      />
      <SummaryCard
        title="Remaining Budget"
        value={formatCurrency(remaining)}
        icon={Tag}
        spark={seriesFor(Math.max(remaining, 1000), -0.35)}
        sparkColor="#F59E0B"
        toneSoft="rgba(245, 158, 11, 0.12)"
        index={3}
      />
      <SummaryCard
        title="Budget Utilization"
        value={`${utilization.toFixed(1)}%`}
        icon={Gauge}
        spark={null}
        progressPercent={utilization}
        sparkColor="#5B5CF0"
        toneSoft="rgba(91, 92, 240, 0.14)"
        index={4}
      />
    </div>
  );
}
