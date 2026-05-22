import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, PieChart } from 'lucide-react';

import { budgetService } from '../api/services/budgetService';
import { categoryService } from '../api/services/categoryService';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { BudgetForm } from '../components/budgets/BudgetForm';
import { AppCard } from '../components/ui/AppCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency } from '../lib/format';
import { useAuth } from '../hooks/useAuth';
import type { BudgetResponse } from '../types';

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

const ADD_BTN =
  'flex items-center gap-2 bg-primary hover:bg-primary-hover text-white ' +
  'px-4 py-2 rounded-lg text-sm font-medium ' +
  'transition-all duration-200 active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function BudgetsPage() {
  const { isAdmin } = useAuth();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetResponse | null>(null);

  const { data: budgets, isLoading, isError } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getBudgets,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    staleTime: Infinity,
  });

  // Look up iconName + budgeted-id set once per render. Both are O(N) on
  // category count, which is small (≤ a couple dozen), so no useMemo
  // gymnastics here beyond keeping the set stable.
  const iconByCategoryId = useMemo(() => {
    const map = new Map<number, string | undefined>();
    (categories ?? []).forEach((c) => map.set(c.id, c.iconName));
    return map;
  }, [categories]);

  const budgetedCategoryIds = useMemo(
    () => new Set((budgets ?? []).map((b) => b.categoryId)),
    [budgets],
  );

  // Summary totals — derive client-side rather than asking the backend.
  // These are cheap sums and stay in sync with whatever budgets are loaded.
  const totals = useMemo(() => {
    const list = budgets ?? [];
    let limit = 0;
    let spent = 0;
    let overCount = 0;
    for (const b of list) {
      limit += Number(b.monthlyLimit) || 0;
      spent += Number(b.spent) || 0;
      if (b.isOverBudget) overCount += 1;
    }
    return { limit, spent, overCount };
  }, [budgets]);

  const handleSetBudget = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const handleEdit = (budget: BudgetResponse) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingBudget(null);
  };

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Monthly spending limits per category"
        action={
          isAdmin && (
            <button type="button" onClick={handleSetBudget} className={ADD_BTN}>
              Set budget
            </button>
          )
        }
      />

      {/* Summary row — shown whenever there's at least one budget to summarise. */}
      {budgets && budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <AppCard>
            <p className="text-xs uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
              Total budgeted
            </p>
            <p className="text-2xl font-semibold text-text-primary dark:text-text-dark-primary mt-1">
              {formatCurrency(totals.limit)}
            </p>
          </AppCard>
          <AppCard>
            <p className="text-xs uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
              Total spent
            </p>
            <p className="text-2xl font-semibold text-spend mt-1">
              {formatCurrency(totals.spent)}
            </p>
          </AppCard>
          <AppCard>
            <p className="text-xs uppercase tracking-wider text-text-muted dark:text-text-dark-muted">
              Over budget
            </p>
            <p className={
              'text-2xl font-semibold mt-1 ' +
              (totals.overCount > 0
                ? 'text-danger'
                : 'text-text-muted dark:text-text-dark-muted')
            }>
              {totals.overCount}
            </p>
          </AppCard>
        </div>
      )}

      {isLoading && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
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
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              categoryIconName={iconByCategoryId.get(b.categoryId) ?? null}
              isAdmin={isAdmin}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <BudgetForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        initialData={editingBudget}
        categories={categories ?? []}
        budgetedCategoryIds={budgetedCategoryIds}
        onSuccess={handleFormClose}
      />
    </>
  );
}
