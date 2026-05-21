import { AppCard } from '../ui/AppCard';
import { formatCurrency } from '../../lib/format';
import type { BudgetResponse } from '../../types';

interface BudgetCardProps {
  budget: BudgetResponse;
}

interface BarStyles {
  /** The track (background) the fill sits inside. */
  track: string;
  /** The fill itself, width = percentageUsed clamped to 100. */
  fill: string;
}

/**
 * Three visual tiers driven by the budget's progress:
 *   over budget    → red track + red fill   (unmissable)
 *   ≥ 80% (near)   → amber-tinted track + amber fill
 *   on track       → neutral track + green fill
 */
function getBarStyles(isOverBudget: boolean, isNearLimit: boolean): BarStyles {
  if (isOverBudget) return { track: 'bg-danger-light',  fill: 'bg-danger'  };
  if (isNearLimit)  return { track: 'bg-warning-light', fill: 'bg-warning' };
  return                  { track: 'bg-surface-muted dark:bg-border-dark', fill: 'bg-success' };
}

function StatusBadge({ isOverBudget, isNearLimit }: Pick<BudgetResponse, 'isOverBudget' | 'isNearLimit'>) {
  if (isOverBudget) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-danger-light text-danger">
        Over budget
      </span>
    );
  }
  if (isNearLimit) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning-light text-warning">
        Near limit
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success-light text-success">
      On track
    </span>
  );
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const { track, fill } = getBarStyles(budget.isOverBudget, budget.isNearLimit);

  // BigDecimal arrives as a string — Number() is safe because backend validation
  // guarantees a positive monthlyLimit and a numeric remaining value.
  const remainingNum = Number(budget.remaining);

  return (
    <AppCard className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: budget.categoryColourHex }}
            aria-hidden="true"
          />
          <h3 className="text-base font-medium text-text-primary dark:text-text-dark-primary truncate">
            {budget.categoryName}
          </h3>
        </div>
        <StatusBadge isOverBudget={budget.isOverBudget} isNearLimit={budget.isNearLimit} />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-spend">
            {formatCurrency(budget.spent)}
            <span className="text-text-muted dark:text-text-dark-muted"> of {formatCurrency(budget.monthlyLimit)}</span>
          </span>
          <span className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
            {budget.percentageUsed.toFixed(0)}%
          </span>
        </div>

        <div
          className={`h-2 rounded-full overflow-hidden ${track} transition-colors duration-200`}
          role="progressbar"
          aria-label={`${budget.categoryName} budget`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(Math.round(budget.percentageUsed), 100)}
        >
          <div
            className={`h-full ${fill} transition-all duration-300`}
            style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-text-muted dark:text-text-dark-muted">
        {budget.isOverBudget
          ? <><span className="text-danger font-medium">{formatCurrency(Math.abs(remainingNum))}</span> over budget</>
          : <><span className="text-text-secondary dark:text-text-dark-secondary font-medium">{formatCurrency(budget.remaining)}</span> remaining</>}
      </p>
    </AppCard>
  );
}
