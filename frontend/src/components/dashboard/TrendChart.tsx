import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { format, parse } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { PeriodSelect } from '../ui/PeriodSelect';
import { dashboardService } from '../../api/services/dashboardService';
import { formatCurrency } from '../../lib/format';

const PRIMARY = '#5B5CF0';
// Chart aggregates by month; "Last 30 Days" was visually meaningless at month
// granularity so it's dropped. These options all map to clean monthly windows.
const PERIODS = ['Last 3 Months', 'Last 6 Months', 'Last 12 Months', 'YTD'];

/** Map a period label to ISO yyyy-MM-dd {from, to} bounds for the API. */
function periodToRange(period: string): { from: string; to: string } {
  const today = new Date();
  const to = formatISODate(today);
  const from = (() => {
    if (period === 'YTD') {
      return formatISODate(new Date(today.getFullYear(), 0, 1));
    }
    const monthsBack =
      period === 'Last 12 Months' ? 11
      : period === 'Last 3 Months' ? 2
      : /* Last 6 Months (default) */ 5;
    const d = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
    return formatISODate(d);
  })();
  return { from, to };
}

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface ChartRow {
  m: string;
  v: number;
  fullMonth: string;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 py-2 shadow-pop">
      <div className="text-[11px] text-text-muted dark:text-[#94A3B8]">{p.fullMonth}</div>
      <div className="text-[14px] font-semibold text-text-primary dark:text-[#F5F7FF] tnum">{formatCurrency(p.v)}</div>
    </div>
  );
}

export function TrendChart() {
  const [period, setPeriod] = useState('Last 6 Months');
  const { from, to } = useMemo(() => periodToRange(period), [period]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'trends', from, to],
    queryFn: () => dashboardService.getTrends({ from, to }),
  });

  const rows: ChartRow[] = useMemo(() => {
    if (!data?.months?.length) return [];
    return data.months.map((mo) => {
      const date = parse(mo.month, 'yyyy-MM', new Date());
      return {
        m: format(date, "MMM ''yy"),
        v: Number(mo.total),
        fullMonth: format(date, 'MMMM yyyy'),
      };
    });
  }, [data]);

  const max = rows.length ? Math.max(...rows.map((d) => d.v)) : 0;
  const yMax = Math.max(Math.ceil(max / 10000) * 10000, 40000);

  return (
    <div className="fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-5 sm:p-6 pb-2 shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">Expense Trend</h3>
        <PeriodSelect value={period} options={PERIODS} onChange={setPeriod} />
      </div>

      {isLoading && <Skeleton className="h-[260px] w-full" />}

      {isError && (
        <EmptyState icon={TrendingUp} title="Couldn't load chart" description="Refresh to try again." />
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState icon={TrendingUp} title="No trend data yet" description="Spend data will appear over time." />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <div className="flex-1 min-h-[260px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 14, right: 16, left: 8, bottom: 6 }}>
              <defs>
                <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.42} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} dy={6} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => (v === 0 ? '₹0' : '₹' + (v / 1000).toFixed(0) + 'K')}
                domain={[0, yMax]}
              />
              <Tooltip cursor={{ stroke: 'rgba(91, 92, 240, 0.4)', strokeDasharray: '4 4' }} content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={PRIMARY}
                strokeWidth={2.2}
                fill="url(#trend-gradient)"
                dot={{ r: 3.5, fill: PRIMARY, stroke: 'var(--c-dot-stroke)', strokeWidth: 2 }}
                activeDot={{ r: 5.5, fill: PRIMARY, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive
                animationDuration={1100}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
