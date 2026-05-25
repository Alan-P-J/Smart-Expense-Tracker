import { TrendingDown, TrendingUp } from 'lucide-react';

interface TrendBadgeProps {
  value: number;
  suffix?: string;
}

const BASE =
  'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full';

export function TrendBadge({ value, suffix = '%' }: TrendBadgeProps) {
  if (value > 0) {
    return (
      <span className={`${BASE} bg-success/10 text-success`}>
        <TrendingUp size={12} aria-hidden="true" />
        +{value}{suffix}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className={`${BASE} bg-danger/10 text-danger`}>
        <TrendingDown size={12} aria-hidden="true" />
        {value}{suffix}
      </span>
    );
  }
  return (
    <span
      className={`${BASE} bg-surface-muted dark:bg-border-dark-strong text-text-muted dark:text-[#94A3B8]`}
    >
      — {value}{suffix}
    </span>
  );
}
