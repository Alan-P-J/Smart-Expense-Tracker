import { AlertTriangle, Pencil } from 'lucide-react';

import { AppCard } from '../ui/AppCard';
import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import type { BudgetResponse } from '../../types';

interface BudgetCardProps {
  budget: BudgetResponse;
  /** From the categories cache — BudgetResponse doesn't carry iconName. */
  categoryIconName?: string | null;
  isAdmin: boolean;
  onEdit: (budget: BudgetResponse) => void;
}

interface BarStyles {
  track: string;
  fill: string;
}

/**
 * 3-tier progress styling — the design rule is strict:
 *   over budget    → red fill on a red-tinted track (unmissable)
 *   ≥ 80% (near)   → amber fill on a neutral track
 *   on track       → green fill on a neutral track
 */
function getBarStyles(isOverBudget: boolean, isNearLimit: boolean): BarStyles {
  if (isOverBudget) return { track: 'bg-danger/20', fill: 'bg-danger' };
  if (isNearLimit)  return { track: 'bg-surface-muted dark:bg-border-dark', fill: 'bg-warning' };
  return                  { track: 'bg-surface-muted dark:bg-border-dark', fill: 'bg-success' };
}

function getAmountColor(isOverBudget: boolean, isNearLimit: boolean): string {
  if (isOverBudget) return 'text-danger';
  if (isNearLimit)  return 'text-warning';
  return 'text-text-primary dark:text-text-dark-primary';
}

function getPercentColor(isOverBudget: boolean, isNearLimit: boolean): string {
  if (isOverBudget) return 'text-danger font-medium';
  if (isNearLimit)  return 'text-warning';
  return 'text-success';
}

export function BudgetCard({ budget, categoryIconName, isAdmin, onEdit }: BudgetCardProps) {
  const { track, fill } = getBarStyles(budget.isOverBudget, budget.isNearLimit);
  const amountColor = getAmountColor(budget.isOverBudget, budget.isNearLimit);
  const percentColor = getPercentColor(budget.isOverBudget, budget.isNearLimit);

  // Backend doesn't send overAmount — derive from spent/limit. Same precision
  // caveat as everywhere: BigDecimal-as-string round-trip is fine here because
  // we only ever display the result, never re-submit it.
  const spent = Number(budget.spent);
  const limit = Number(budget.monthlyLimit);
  const overAmount = Math.max(spent - limit, 0);
  const remainingNum = Math.max(limit - spent, 0);

  const Icon = getCategoryIcon(categoryIconName);
  const widthPct = Math.min(budget.percentageUsed, 100);

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: budget.categoryColourHex }}
            aria-hidden="true"
          >
            <Icon size={18} color="white" />
          </div>
          <h3 className="text-base font-semibold text-text-primary dark:text-text-dark-primary truncate">
            {budget.categoryName}
          </h3>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onEdit(budget)}
            aria-label={`Edit ${budget.categoryName} budget`}
            className={
              'p-1.5 rounded-lg text-text-muted dark:text-text-dark-muted ' +
              'hover:text-primary hover:bg-primary-light ' +
              'transition-colors duration-150 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            }
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-3">
        <span className={`text-2xl font-semibold ${amountColor}`}>
          {formatCurrency(budget.spent)}
        </span>
        <span className="text-text-muted dark:text-text-dark-muted ml-1">
          / {formatCurrency(budget.monthlyLimit)}
        </span>
      </div>

      <div
        className={`mt-2 h-2 rounded-full overflow-hidden ${track} transition-colors duration-200`}
        role="progressbar"
        aria-label={`${budget.categoryName} budget`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(Math.round(budget.percentageUsed), 100)}
      >
        <div
          className={`h-full ${fill} transition-all duration-500`}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm">
        <span className={percentColor}>
          {budget.percentageUsed.toFixed(0)}% used
        </span>
        <span className={budget.isOverBudget ? 'text-danger' : 'text-text-muted dark:text-text-dark-muted'}>
          {budget.isOverBudget
            ? `${formatCurrency(overAmount)} over limit`
            : `${formatCurrency(remainingNum)} remaining`}
        </span>
      </div>

      {budget.isOverBudget && (
        <div className="mt-3 flex items-center gap-2 text-xs bg-danger/10 text-danger px-3 py-2 rounded-lg">
          <AlertTriangle size={12} aria-hidden="true" />
          <span>Over budget by {formatCurrency(overAmount)}</span>
        </div>
      )}

      {!budget.isOverBudget && budget.isNearLimit && (
        <div className="mt-3 flex items-center gap-2 text-xs bg-warning/10 text-warning px-3 py-2 rounded-lg">
          <AlertTriangle size={12} aria-hidden="true" />
          <span>Approaching limit — {Math.max(100 - budget.percentageUsed, 0).toFixed(0)}% remaining</span>
        </div>
      )}
    </AppCard>
  );
}
