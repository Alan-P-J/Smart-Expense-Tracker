import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Receipt } from 'lucide-react';

import { AppCard } from '../ui/AppCard';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { dashboardService } from '../../api/services/dashboardService';
import { formatCurrency } from '../../lib/format';
import { getCategoryBg, getCategoryIcon } from '../../utils/categoryIconMap';
import type { RecentExpenseResponse } from '../../types';

const ROW = 'flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-surface-muted dark:hover:bg-border-dark/50 transition-colors duration-150';

function Row({ expense }: { expense: RecentExpenseResponse }) {
  // Backend doesn't carry iconName on RecentExpenseResponse yet — falls back to Receipt.
  const Icon = getCategoryIcon(null);

  return (
    <div className={ROW}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: getCategoryBg(expense.categoryColourHex) }}
        aria-hidden="true"
      >
        <Icon size={16} style={{ color: expense.categoryColourHex }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate max-w-[140px]">
          {expense.title}
        </p>
        <p className="text-xs text-text-muted dark:text-text-dark-muted">
          {format(parseISO(expense.expenseDate), 'dd MMM')} · {expense.categoryName}
        </p>
      </div>

      <span className="ml-auto text-sm font-medium text-spend">
        {formatCurrency(expense.amount)}
      </span>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-2">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-24 mt-1" />
      </div>
      <Skeleton className="h-3.5 w-16" />
    </div>
  );
}

export function RecentExpenses() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: dashboardService.getRecent,
  });

  return (
    <AppCard>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
          Recent expenses
        </h2>
        <Link
          to="/expenses"
          className="text-sm text-primary hover:text-primary-hover hover:underline transition-colors duration-150"
        >
          View all
        </Link>
      </div>

      {isLoading && (
        <div className="divide-y divide-border dark:divide-border-dark">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingRow key={i} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Receipt}
          title="Couldn't load recent expenses"
          description="Refresh to try again."
        />
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Add your first expense to get started."
          actionLabel="Add expense"
          onAction={() => navigate('/expenses')}
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="divide-y divide-border dark:divide-border-dark">
          {data.map((expense) => (
            <Row key={expense.id} expense={expense} />
          ))}
        </div>
      )}
    </AppCard>
  );
}
