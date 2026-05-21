import { Pencil, Receipt, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../lib/format';
import { getCategoryBg, getCategoryIcon } from '../../utils/categoryIconMap';
import type { ExpenseResponse } from '../../types';

interface ExpenseTableProps {
  expenses: ExpenseResponse[];
  isLoading: boolean;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  isAdmin: boolean;
  hasFilters?: boolean;
}

const COLUMNS_ADMIN = 5;
const COLUMNS_VIEWER = 4;

const TH =
  'text-xs font-medium text-text-muted dark:text-text-dark-muted ' +
  'uppercase tracking-wider px-4 py-3 text-left';

const TD = 'px-4 py-3 align-middle';

const ROW =
  'border-b border-border dark:border-border-dark ' +
  'hover:bg-surface-muted dark:hover:bg-border-dark/50 ' +
  'transition-colors duration-150';

const ICON_BTN_BASE =
  'p-1.5 rounded-lg text-text-muted dark:text-text-dark-muted ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function ExpenseTable({
  expenses,
  isLoading,
  onEdit,
  onDelete,
  isAdmin,
  hasFilters = false,
}: ExpenseTableProps) {
  const colCount = isAdmin ? COLUMNS_ADMIN : COLUMNS_VIEWER;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-auto md:table-fixed">
        <colgroup>
          <col className="w-[100px]" />
          <col />
          <col className="w-[160px]" />
          <col className="w-[120px]" />
          {isAdmin && <col className="w-[80px]" />}
        </colgroup>

        <thead className="bg-surface-muted dark:bg-border-dark/40 border-b border-border dark:border-border-dark">
          <tr>
            <th className={TH}>Date</th>
            <th className={TH}>Title</th>
            <th className={TH}>Category</th>
            <th className={`${TH} text-right`}>Amount</th>
            {isAdmin && <th className={`${TH} text-right`}>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <tr key={`skeleton-${i}`} className={ROW}>
              <td className={TD}><Skeleton className="h-4 w-20" /></td>
              <td className={TD}><Skeleton className="h-4 w-40" /></td>
              <td className={TD}><Skeleton className="h-4 w-28" /></td>
              <td className={TD}><Skeleton className="h-4 w-20 ml-auto" /></td>
              {isAdmin && <td className={TD}><Skeleton className="h-6 w-16 ml-auto" /></td>}
            </tr>
          ))}

          {!isLoading && expenses.length === 0 && (
            <tr>
              <td colSpan={colCount} className="py-12 text-center">
                <EmptyState
                  icon={Receipt}
                  title="No expenses found"
                  description={
                    hasFilters
                      ? 'Try adjusting your filters'
                      : 'Add your first expense to get started'
                  }
                />
              </td>
            </tr>
          )}

          {!isLoading && expenses.map((e) => {
            // ExpenseResponse doesn't carry iconName — falls back to Receipt.
            const Icon = getCategoryIcon(null);
            return (
              <tr key={e.id} className={ROW}>
                <td className={`${TD} text-text-muted dark:text-text-dark-muted whitespace-nowrap`}>
                  {format(parseISO(e.expenseDate), 'dd MMM yyyy')}
                </td>

                <td className={TD}>
                  <p className="font-medium text-text-primary dark:text-text-dark-primary truncate">
                    {e.title}
                  </p>
                  {e.description && (
                    <p className="text-xs text-text-muted dark:text-text-dark-muted truncate max-w-xs">
                      {e.description}
                    </p>
                  )}
                </td>

                <td className={TD}>
                  <div className="flex items-center min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: getCategoryBg(e.categoryColourHex) }}
                      aria-hidden="true"
                    >
                      <Icon size={12} style={{ color: e.categoryColourHex }} />
                    </div>
                    <span className="text-text-secondary dark:text-text-dark-secondary ml-2 truncate">
                      {e.categoryName}
                    </span>
                  </div>
                </td>

                <td className={`${TD} text-right font-medium text-spend whitespace-nowrap`}>
                  {formatCurrency(e.amount)}
                </td>

                {isAdmin && (
                  <td className={TD}>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(e)}
                        aria-label="Edit expense"
                        className={`${ICON_BTN_BASE} hover:text-primary hover:bg-primary-light`}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(e)}
                        aria-label="Delete expense"
                        className={`${ICON_BTN_BASE} hover:text-danger hover:bg-danger/10`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
