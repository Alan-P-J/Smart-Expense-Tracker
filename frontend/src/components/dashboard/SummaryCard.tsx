import type { LucideIcon } from 'lucide-react';
import { AppCard } from '../ui/AppCard';
import { Skeleton } from '../ui/Skeleton';
import { TrendBadge } from '../ui/TrendBadge';
import { formatCurrency } from '../../lib/format';

export type TrendKind = 'delta' | 'currency';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;       // Tailwind bg class, e.g. 'bg-primary-light'
  iconColor: string;    // Tailwind text class, e.g. 'text-primary'
  trend?: { value: number; label: string };
  /**
   * How to render the trend value.
   *   'delta'    — TrendBadge with +/- and the supplied suffix (default '%')
   *   'currency' — plain INR amount in spend color (used by Top Category)
   * Default: 'delta'.
   */
  trendKind?: TrendKind;
  isLoading?: boolean;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendKind = 'delta',
  isLoading = false,
}: SummaryCardProps) {
  return (
    <AppCard className="hover:shadow-sm transition-shadow duration-200">
      {/* Header row: title + icon tile */}
      <div className="flex items-start justify-between">
        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <h3 className="text-sm text-text-muted dark:text-text-dark-muted">{title}</h3>
        )}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
          aria-hidden="true"
        >
          <Icon size={18} className={iconColor} />
        </div>
      </div>

      {/* Value */}
      {isLoading ? (
        <Skeleton className="h-8 w-32 mt-2" />
      ) : (
        <p className="mt-2 text-2xl font-semibold text-text-primary dark:text-text-dark-primary">
          {value}
        </p>
      )}

      {/* Trend (optional) */}
      {isLoading ? (
        <Skeleton className="h-4 w-20 mt-2" />
      ) : (
        trend && (
          <div className="mt-2 flex items-center">
            {trendKind === 'currency' ? (
              <span className="text-xs font-medium text-spend">
                {formatCurrency(trend.value)}
              </span>
            ) : (
              <TrendBadge value={trend.value} />
            )}
            <span className="text-xs text-text-muted dark:text-text-dark-muted ml-1.5">
              {trend.label}
            </span>
          </div>
        )
      )}
    </AppCard>
  );
}
