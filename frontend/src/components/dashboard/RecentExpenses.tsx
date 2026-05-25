import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowRight, Receipt } from 'lucide-react';

import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { CategoryChip } from '../ui/CategoryChip';
import { dashboardService } from '../../api/services/dashboardService';
import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import type { RecentExpenseResponse } from '../../types';

const GRID = 'grid grid-cols-[1.7fr_0.8fr_0.9fr_0.7fr]';

function Row({ expense }: { expense: RecentExpenseResponse }) {
  const Icon = getCategoryIcon(null);
  const color = expense.categoryColourHex;
  return (
    <div className={GRID + ' items-center px-3 h-[58px] hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition rounded-lg border-t border-border dark:border-[#1F2A44] first:border-t-0'}>
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: color + '1f', color }}
          aria-hidden="true"
        >
          <Icon size={16} style={{ color }} />
        </div>
        <div className="text-[13.5px] font-medium text-text-primary dark:text-[#F5F7FF] truncate">{expense.title}</div>
      </div>
      <div><CategoryChip name={expense.categoryName} color={color} /></div>
      <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8] tnum">
        {format(parseISO(expense.expenseDate), 'MMM dd, yyyy')}
      </div>
      <div className="text-right text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] tnum pr-1">
        {formatCurrency(expense.amount)}
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className={GRID + ' items-center px-3 h-[58px] border-t border-border dark:border-[#1F2A44] first:border-t-0'}>
      <div className="flex items-center gap-3"><Skeleton className="w-9 h-9 rounded-lg" /><Skeleton className="h-4 w-32" /></div>
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-4 w-16 ml-auto" />
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
    <div className="fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-5 sm:p-6 shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">Recent Expenses</h3>
        <Link
          to="/expenses"
          className="text-[12.5px] font-semibold text-accent hover:opacity-80 inline-flex items-center gap-1 transition"
        >
          View All <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {isError && (
        <EmptyState icon={Receipt} title="Couldn't load recent expenses" description="Refresh to try again." />
      )}

      {!isError && !isLoading && (!data || data.length === 0) && (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Add your first expense to get started."
          actionLabel="Add expense"
          onAction={() => navigate('/expenses')}
        />
      )}

      {(isLoading || (data && data.length > 0)) && (
        <div>
          <div className={GRID + ' px-3 pb-3 text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] border-b border-border dark:border-[#1F2A44]'}>
            <div>Description</div>
            <div>Category</div>
            <div>Date</div>
            <div className="text-right pr-1">Amount</div>
          </div>
          <div>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <LoadingRow key={i} />)
              : data?.map((expense) => <Row key={expense.id} expense={expense} />)}
          </div>
        </div>
      )}
    </div>
  );
}
