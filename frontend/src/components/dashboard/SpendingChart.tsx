import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, ArrowRight } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { PeriodSelect } from '../ui/PeriodSelect';
import { dashboardService } from '../../api/services/dashboardService';
import { formatCurrency } from '../../lib/format';
import type { CategorySpendResponse } from '../../types';

const FALLBACK = ['#5B5CF0', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
const PERIODS = ['This Week', 'This Month', 'This Quarter', 'This Year'];

function pickColor(c: CategorySpendResponse, i: number): string {
  return c.categoryColourHex || FALLBACK[i % FALLBACK.length];
}

/** Map a period label to ISO yyyy-MM-dd {from, to} bounds for the API. */
function periodToRange(period: string): { from: string; to: string } {
  const today = new Date();
  const to = formatISODate(today);
  const from = (() => {
    if (period === 'This Year') {
      return formatISODate(new Date(today.getFullYear(), 0, 1));
    }
    if (period === 'This Quarter') {
      const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
      return formatISODate(new Date(today.getFullYear(), qStartMonth, 1));
    }
    if (period === 'This Week') {
      // ISO week: Monday as start of week.
      const d = new Date(today);
      const day = (d.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
      d.setDate(d.getDate() - day);
      return formatISODate(d);
    }
    // This Month (default)
    return formatISODate(new Date(today.getFullYear(), today.getMonth(), 1));
  })();
  return { from, to };
}

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function SpendingChart() {
  const [period, setPeriod] = useState('This Month');
  const [active, setActive] = useState<number | null>(null);

  const { from, to } = useMemo(() => periodToRange(period), [period]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'by-category', from, to],
    queryFn: () => dashboardService.getByCategory({ from, to }),
  });

  const slices = useMemo(() => {
    if (!data) return [];
    const total = data.reduce((sum, c) => sum + Number(c.total), 0);
    return data.map((c, i) => ({
      ...c,
      total: Number(c.total),
      pct: total > 0 ? Math.round((Number(c.total) / total) * 100) : 0,
      fill: pickColor(c, i),
    }));
  }, [data]);

  const total = slices.reduce((s, x) => s + x.total, 0);
  const centerValue = active != null ? slices[active]?.total ?? total : total;
  const centerLabel = active != null ? slices[active]?.categoryName ?? 'Total' : 'Total';

  return (
    <div className="fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-5 sm:p-6 shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">Spending by Category</h3>
        <PeriodSelect value={period} options={PERIODS} onChange={setPeriod} />
      </div>

      {isLoading && <Skeleton className="h-[260px] w-full mt-4" />}

      {isError && (
        <EmptyState icon={BarChart2} title="Couldn't load chart" description="Refresh to try again." />
      )}

      {!isLoading && !isError && slices.length === 0 && (
        <EmptyState icon={BarChart2} title="No spending data" description="Add expenses to see category breakdown." />
      )}

      {!isLoading && !isError && slices.length > 0 && (
        <>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 min-w-0">
            {/* Donut */}
            <div className="relative w-[180px] h-[180px] sm:w-[210px] sm:h-[210px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="total"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={98}
                    paddingAngle={2}
                    stroke="none"
                    onMouseEnter={(_, i) => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    isAnimationActive
                    animationDuration={900}
                  >
                    {slices.map((s, i) => (
                      <Cell
                        key={s.categoryId}
                        fill={s.fill}
                        opacity={active == null || active === i ? 1 : 0.45}
                        style={{
                          filter: active === i ? 'drop-shadow(0 0 14px rgba(91, 92, 240, 0.45))' : 'none',
                          transition: 'opacity .2s, filter .2s',
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[19px] font-bold text-text-primary dark:text-[#F5F7FF] tnum">
                  {formatCurrency(centerValue)}
                </div>
                <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">{centerLabel}</div>
              </div>
            </div>

            {/* Legend */}
            <ul className="flex-1 min-w-[200px] flex flex-col gap-2.5">
              {slices.slice(0, 5).map((s, i) => (
                <li
                  key={s.categoryId}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className={
                    'flex items-center gap-3 h-9 px-2.5 rounded-lg cursor-default transition min-w-0 ' +
                    (active === i ? 'bg-surface-muted dark:bg-[#121B32]/60' : '')
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: s.fill }}
                    aria-hidden="true"
                  />
                  <span className="text-[13.5px] text-text-primary dark:text-[#F5F7FF] truncate flex-1 min-w-0">
                    {s.categoryName}
                  </span>
                  <span className="text-[12.5px] text-text-muted dark:text-[#94A3B8] tnum flex-shrink-0">
                    {s.pct}%
                  </span>
                  <span className="text-[13px] text-text-primary dark:text-[#F5F7FF] tnum font-medium flex-shrink-0">
                    {formatCurrency(s.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="mt-3 self-start text-[12.5px] font-semibold text-accent hover:opacity-80 inline-flex items-center gap-1 transition"
          >
            View full breakdown <ArrowRight size={13} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
