import { useQuery } from '@tanstack/react-query';
import { AlertCircle, PieChart } from 'lucide-react';

import { budgetService } from '../api/services/budgetService';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

const GRID = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3';

export function BudgetsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getBudgets,
  });

  if (isLoading) {
    return (
      <div className={GRID} aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load budgets"
        description="There was a problem fetching your budgets. Refresh to try again."
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No budgets yet"
        description="Set monthly limits per category to track your spending against goals."
      />
    );
  }

  return (
    <div className={GRID}>
      {data.map((budget) => (
        <BudgetCard key={budget.id} budget={budget} />
      ))}
    </div>
  );
}
