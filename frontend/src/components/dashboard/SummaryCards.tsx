import { useQuery } from '@tanstack/react-query';
import { CreditCard, FileText, Gauge, Plus, Tag } from 'lucide-react';

import { SummaryCard } from './SummaryCard';
import { dashboardService } from '../../api/services/dashboardService';
import { budgetService } from '../../api/services/budgetService';
import { formatCurrency } from '../../lib/format';
import type { DateRange } from '../ui/DateRangePill';

const GRID = 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5';

function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

interface SummaryCardsProps {
  range: DateRange;
}

export function SummaryCards({ range }: SummaryCardsProps) {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary', range.from, range.to],
    queryFn: () => dashboardService.getSummary({ from: range.from, to: range.to }),
  });
  const trends = useQuery({ queryKey: ['dashboard', 'trends'], queryFn: () => dashboardService.getTrends() });
  const budgets = useQuery({ queryKey: ['budgets'], queryFn: budgetService.getBudgets });

  const isLoading = summary.isLoading || budgets.isLoading || trends.isLoading;

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

  // ── Headline numbers (current month) ──────────────────────────────────────
  const totalExpenses = Number(summary.data?.totalAmount ?? 0);
  const totalBudget = (budgets.data ?? []).reduce((s, b) => s + Number(b.monthlyLimit || 0), 0);
  const amountSpent = (budgets.data ?? []).reduce((s, b) => s + Number(b.spent || 0), 0);
  // Fall back to summary.totalAmount when no budgets exist so the spent card stays meaningful.
  const spent = totalBudget > 0 ? amountSpent : totalExpenses;
  const remaining = Math.max(totalBudget - spent, 0);
  const utilization = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  // ── Real time series from /trends (last 6 months by default) ──────────────
  // Each card's sparkline is derived from the same monthly series so charts
  // line up visually and stay honest with the values shown.
  const months = trends.data?.months ?? [];
  const monthlyTotals = months.map((m) => Number(m.total));
  // Budgets are a constant per month (current configuration) → flat line.
  // Honest visualisation: budget hasn't varied.
  const budgetSeries = monthlyTotals.map(() => totalBudget);
  // Spent: capped at budget so the line doesn't visually exceed the budget
  // floor; the actual overrun is still surfaced via the value + delta.
  const spentSeries = monthlyTotals.map((m) => (totalBudget > 0 ? Math.min(m, totalBudget) : m));
  const remainingSeries = monthlyTotals.map((m) => Math.max(totalBudget - m, 0));

  // Month-over-month delta — last entry is current month.
  const currentMonthTotal = monthlyTotals.length ? monthlyTotals[monthlyTotals.length - 1] : null;
  const previousMonthTotal = monthlyTotals.length >= 2 ? monthlyTotals[monthlyTotals.length - 2] : null;
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
        spark={monthlyTotals}
        sparkColor="#5B5CF0"
        toneSoft="rgba(91, 92, 240, 0.14)"
        trend={expensesDelta != null ? { value: expensesDelta, label: 'vs last month' } : undefined}
        index={0}
      />
      <SummaryCard
        title="Total Budget"
        value={formatCurrency(totalBudget)}
        icon={FileText}
        spark={budgetSeries}
        sparkColor="#38BDF8"
        toneSoft="rgba(56, 189, 248, 0.12)"
        index={1}
      />
      <SummaryCard
        title="Amount Spent"
        value={formatCurrency(spent)}
        icon={Plus}
        spark={spentSeries}
        sparkColor="#10B981"
        toneSoft="rgba(16, 185, 129, 0.12)"
        trend={expensesDelta != null ? { value: expensesDelta, label: 'vs last month' } : undefined}
        index={2}
      />
      <SummaryCard
        title="Remaining Budget"
        value={formatCurrency(remaining)}
        icon={Tag}
        spark={remainingSeries}
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
