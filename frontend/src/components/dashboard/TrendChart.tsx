import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { format, parse } from 'date-fns';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AppCard } from '../ui/AppCard';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { dashboardService } from '../../api/services/dashboardService';
import { useChartColors } from '../../hooks/useChartColors';
import { formatCurrency } from '../../lib/format';

// Brand indigo — same hex as design token `primary.DEFAULT`. Kept inline
// because Recharts SVG props don't read Tailwind classes.
const PRIMARY_HEX = '#4F46E5';

interface ChartRow {
  label: string;       // "Jan", "Feb", …
  total: number;       // numeric for Recharts
  fullMonth: string;   // "January 2025" for tooltip
}

// Recharts 3.x narrowed TooltipProps so `payload` isn't on the public type.
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
  tooltipBg: string;
  tooltipBorder: string;
}

function ChartTooltip({ active, payload, tooltipBg, tooltipBorder }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg text-sm border"
      style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
    >
      <div className="font-medium text-text-primary dark:text-text-dark-primary">
        {row.fullMonth}
      </div>
      <div className="text-spend font-medium">{formatCurrency(row.total)}</div>
    </div>
  );
}

export function TrendChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: dashboardService.getTrends,
  });
  const { gridColor, tickColor, tooltipBg, tooltipBorder } = useChartColors();

  // Transform "YYYY-MM" → { label: "MMM", total, fullMonth: "MMMM yyyy" }.
  const rows: ChartRow[] = useMemo(() => {
    if (!data?.months?.length) return [];
    return data.months.map((m) => {
      const date = parse(m.month, 'yyyy-MM', new Date());
      return {
        label: format(date, 'MMM'),
        total: Number(m.total),
        fullMonth: format(date, 'MMMM yyyy'),
      };
    });
  }, [data]);

  return (
    <AppCard>
      <div className="mb-4">
        <h2 className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
          Monthly trend
        </h2>
        <p className="text-xs text-text-muted dark:text-text-dark-muted">Last 6 months</p>
      </div>

      {isLoading && <Skeleton className="h-[240px] w-full" />}

      {isError && (
        <EmptyState
          icon={TrendingUp}
          title="Couldn't load chart"
          description="Refresh to try again."
        />
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState
          icon={TrendingUp}
          title="No trend data yet"
          description="Spend data will appear over time."
        />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={rows} margin={{ top: 4, right: 4, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: tickColor }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: tickColor }}
              tickFormatter={(v: number) => '₹' + (v / 1000).toFixed(0) + 'k'}
            />
            <Tooltip
              content={<ChartTooltip tooltipBg={tooltipBg} tooltipBorder={tooltipBorder} />}
              cursor={{ stroke: gridColor }}
            />
            <Line
              dataKey="total"
              stroke={PRIMARY_HEX}
              strokeWidth={2}
              type="monotone"
              dot={{ fill: PRIMARY_HEX, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: PRIMARY_HEX, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </AppCard>
  );
}
