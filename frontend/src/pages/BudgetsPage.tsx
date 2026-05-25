import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, PieChart, Plus, Settings } from 'lucide-react';
import { format } from 'date-fns';

import { budgetService } from '../api/services/budgetService';
import { categoryService } from '../api/services/categoryService';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { AddBudgetCard } from '../components/budgets/AddBudgetCard';
import { BudgetDrawer } from '../components/budgets/BudgetDrawer';
import { BudgetRing } from '../components/budgets/BudgetRing';
import { BudgetForm } from '../components/budgets/BudgetForm';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../lib/format';
import { useAuth } from '../hooks/useAuth';
import type { BudgetResponse } from '../types';

const PERIODS = ['All', 'Monthly', 'Quarterly', 'Annual'] as const;
type Period = (typeof PERIODS)[number];

const GRID = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5';

function StatBlock({
  label,
  value,
  sub,
  dotColor,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  dotColor: string;
}) {
  return (
    <div className="p-5 sm:p-6 flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
        <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
          {label}
        </span>
      </div>
      <div className="text-[22px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight tnum mt-1.5 truncate">
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function daysLeftOfMonth(): number {
  const today = new Date();
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Math.max(last - today.getDate(), 0);
}

function elapsedDaysOfMonth(): number {
  return Math.max(new Date().getDate(), 1);
}

export function BudgetsPage() {
  const { isAdmin } = useAuth();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetResponse | null>(null);
  const [drawerBudget, setDrawerBudget] = useState<BudgetResponse | null>(null);
  const [period, setPeriod] = useState<Period>('All');

  // Open form when navigated here from the topbar quick-add (?new=1).
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === '1' && isAdmin) {
      setEditingBudget(null);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isAdmin]);

  const { data: budgets, isLoading, isError } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getBudgets,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    staleTime: Infinity,
  });

  const iconByCategoryId = useMemo(() => {
    const map = new Map<number, string | undefined>();
    (categories ?? []).forEach((c) => map.set(c.id, c.iconName));
    return map;
  }, [categories]);

  const budgetedCategoryIds = useMemo(
    () => new Set((budgets ?? []).map((b) => b.categoryId)),
    [budgets],
  );

  const totals = useMemo(() => {
    const list = budgets ?? [];
    let limit = 0;
    let spent = 0;
    let overCount = 0;
    let overAmount = 0;
    for (const b of list) {
      const s = Number(b.spent) || 0;
      const l = Number(b.monthlyLimit) || 0;
      limit += l;
      spent += s;
      if (b.isOverBudget) {
        overCount += 1;
        overAmount += Math.max(s - l, 0);
      }
    }
    return { limit, spent, overCount, overAmount };
  }, [budgets]);

  const remaining = Math.max(totals.limit - totals.spent, 0);
  const pctUsed = totals.limit > 0 ? (totals.spent / totals.limit) * 100 : 0;
  const ringColor = pctUsed > 100 ? '#EF4444' : pctUsed > 80 ? '#F59E0B' : '#5B5CF0';
  const elapsed = elapsedDaysOfMonth();
  const projected = elapsed > 0 ? Math.round(totals.spent * (30 / elapsed)) : 0;
  const daysLeft = daysLeftOfMonth();

  // Backend stores monthly limits only. Treat all budgets as Monthly so the
  // filter still reads cleanly without inventing a period column on the wire.
  const filteredBudgets = useMemo(() => {
    if (!budgets) return [];
    if (period === 'All' || period === 'Monthly') return budgets;
    return [];
  }, [budgets, period]);

  const handleSetBudget = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const handleEdit = (budget: BudgetResponse) => {
    setEditingBudget(budget);
    setFormOpen(true);
    setDrawerBudget(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingBudget(null);
  };

  const todayLabel = format(new Date(), 'MMMM yyyy');

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
            Budgets
          </h1>
          <p className="text-[12.5px] sm:text-[13px] text-text-muted dark:text-[#94A3B8] mt-1">
            {todayLabel}
            {budgets ? ` · ${budgets.length} active budgets` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            className="h-10 px-3 sm:px-3.5 rounded-lg border border-border-strong dark:border-[#2D3956] bg-white dark:bg-[#1A233A] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition inline-flex items-center gap-1.5 sm:gap-2 text-[12.5px] sm:text-[13px]"
          >
            <Settings size={15} aria-hidden="true" /> <span className="hidden sm:inline">Settings</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleSetBudget}
              className="h-10 px-3.5 sm:px-4 rounded-lg text-white text-[12.5px] sm:text-[13px] font-semibold inline-flex items-center gap-1.5 sm:gap-2 transition active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
              style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
            >
              <Plus size={15} aria-hidden="true" /> New budget
            </button>
          )}
        </div>
      </div>

      {/* Summary hero — only when there is data */}
      {!isLoading && budgets && budgets.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-border dark:divide-[#1F2A44]">
            <div className="p-5 sm:p-6 flex items-center gap-4 sm:gap-5 sm:col-span-2 lg:col-span-1">
              <BudgetRing pct={pctUsed} color={ringColor} />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
                  Used this month
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <div className="text-[24px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight tnum">
                    {formatCurrency(totals.spent)}
                  </div>
                  <div className="text-[13px] text-text-muted dark:text-[#94A3B8] tnum">
                    / {formatCurrency(totals.limit)}
                  </div>
                </div>
                <div className="text-[12px] text-text-muted dark:text-[#94A3B8] mt-1 tnum">
                  {formatCurrency(remaining)} remaining · {daysLeft} days left
                </div>
              </div>
            </div>

            <StatBlock
              label="Total budgeted"
              value={formatCurrency(totals.limit)}
              sub={`${budgets.length} active budgets`}
              dotColor="#5B5CF0"
            />
            <StatBlock
              label="Over budget"
              value={totals.overCount}
              sub={
                totals.overCount > 0
                  ? `${formatCurrency(totals.overAmount)} over total`
                  : 'All within limits'
              }
              dotColor={totals.overCount > 0 ? '#EF4444' : '#10B981'}
            />
            <StatBlock
              label="Projected"
              value={formatCurrency(projected)}
              sub={projected > totals.limit ? `${formatCurrency(projected - totals.limit)} over forecast` : 'On track for month'}
              dotColor={projected > totals.limit ? '#F59E0B' : '#10B981'}
            />
          </div>
        </div>
      )}

      {/* Period segmented + count */}
      {!isLoading && budgets && budgets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex h-10 rounded-lg bg-white dark:bg-[#1A233A] border border-border-strong dark:border-[#2D3956] p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={
                  'px-2.5 sm:px-3.5 rounded-md text-[12px] sm:text-[12.5px] font-semibold transition ' +
                  (period === p
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF]')
                }
              >
                {p}
              </button>
            ))}
          </div>
          <span className="text-[12px] sm:text-[12.5px] text-text-muted dark:text-[#94A3B8]">
            <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{filteredBudgets.length}</span> of{' '}
            <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{budgets.length}</span>
          </span>
        </div>
      )}

      {/* Body */}
      {isLoading && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load budgets"
          description="There was a problem fetching your budgets. Refresh to try again."
        />
      )}

      {!isLoading && !isError && budgets && budgets.length === 0 && (
        <EmptyState
          icon={PieChart}
          title="No budgets set"
          description="Set monthly limits to track your spending"
          actionLabel={isAdmin ? 'Set first budget' : undefined}
          onAction={isAdmin ? handleSetBudget : undefined}
        />
      )}

      {!isLoading && !isError && budgets && budgets.length > 0 && (
        <div className={GRID}>
          {filteredBudgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              categoryIconName={iconByCategoryId.get(b.categoryId) ?? null}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onSelect={setDrawerBudget}
            />
          ))}
          {isAdmin && <AddBudgetCard onAdd={handleSetBudget} />}
        </div>
      )}

      <div className="h-2" />

      <BudgetDrawer
        budget={drawerBudget}
        categoryIconName={drawerBudget ? iconByCategoryId.get(drawerBudget.categoryId) ?? null : null}
        isAdmin={isAdmin}
        onClose={() => setDrawerBudget(null)}
        onEdit={handleEdit}
      />

      <BudgetForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        initialData={editingBudget}
        categories={categories ?? []}
        budgetedCategoryIds={budgetedCategoryIds}
        onSuccess={handleFormClose}
      />
    </div>
  );
}
