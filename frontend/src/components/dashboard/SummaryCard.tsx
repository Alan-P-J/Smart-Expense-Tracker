import type { LucideIcon } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { Skeleton } from '../ui/Skeleton';

export type Trend = { value: number; label: string };

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  /** Series for the sparkline footer. Pass `null` to render a progress bar instead. */
  spark: number[] | null;
  /** Sparkline / progress bar tint hex. */
  sparkColor: string;
  /** Background tone for the small icon tile (matches the value's series). */
  toneSoft: string;
  trend?: Trend;
  /** If spark is null, percent (0–100) for the progress bar. */
  progressPercent?: number;
  /** Card index — used for staggered entry. */
  index?: number;
  isLoading?: boolean;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  spark,
  sparkColor,
  toneSoft,
  trend,
  progressPercent,
  index = 0,
  isLoading = false,
}: SummaryCardProps) {
  const sparkData = spark?.map((v, i) => ({ x: i, y: v }));
  const gradientId = `kpi-spark-${sparkColor.replace('#', '')}-${index}`;
  const isUp = trend ? trend.value >= 0 : true;

  return (
    <div
      className={
        'fade-up rounded-2xl bg-white dark:bg-[#1A233A] ' +
        'border border-border dark:border-[#1F2A44] p-4 sm:p-5 pb-0 ' +
        'shadow-card hover:border-border-strong dark:hover:border-[#2D3956] hover:-translate-y-0.5 ' +
        'transition-all duration-200'
      }
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between">
        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <div className="text-[12.5px] font-medium text-text-muted dark:text-[#94A3B8]">{title}</div>
        )}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: toneSoft, color: sparkColor }}
          aria-hidden="true"
        >
          <Icon size={15} style={{ color: sparkColor }} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-32 mt-2.5" />
      ) : (
        <div className="mt-2.5 text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tnum tracking-tight">{value}</div>
      )}

      {isLoading ? (
        <Skeleton className="h-5 w-28 mt-3" />
      ) : (
        trend && (
          <div className="mt-3 flex items-center gap-2 text-[12px]">
            <span
              className={
                'inline-flex items-center gap-1 px-1.5 h-[22px] rounded-md font-semibold tnum ' +
                (isUp ? 'text-success bg-success-soft' : 'text-warning bg-warning-soft')
              }
            >
              {isUp ? <ArrowUp size={11} aria-hidden="true" /> : <ArrowDown size={11} aria-hidden="true" />}
              {Math.abs(trend.value).toFixed(1)}%
            </span>
            <span className="text-text-muted dark:text-[#94A3B8]">{trend.label}</span>
          </div>
        )
      )}

      {/* Sparkline footer (extends to card edges) or progress bar */}
      <div className="mt-4 -mx-4 sm:-mx-5 h-[58px]">
        {isLoading ? (
          <div className="px-5 h-full flex items-end pb-5">
            <Skeleton className="w-full h-2 rounded-full" />
          </div>
        ) : sparkData && sparkData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke={sparkColor}
                strokeWidth={1.8}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={false}
                isAnimationActive
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : progressPercent != null ? (
          <div className="px-4 sm:px-5 h-full flex items-end pb-5">
            <div className="w-full h-[6px] rounded-full bg-surface-muted dark:bg-[#121B32] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                  background: 'linear-gradient(90deg, #5B5CF0 0%, #8B5CF6 100%)',
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
