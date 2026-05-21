import { useQuery } from '@tanstack/react-query';
import { BarChart2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { CategorySpendResponse } from '../../types';

// Recharts 3.x narrowed TooltipProps so `payload` isn't on the public type.
// Custom Tooltip content receives this shape at runtime — type it directly.
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CategorySpendResponse }>;
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
        {row.categoryName}
      </div>
      <div className="text-spend font-medium">{formatCurrency(row.total)}</div>
    </div>
  );
}

export function SpendingChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'by-category'],
    queryFn: dashboardService.getByCategory,
  });
  const { gridColor, tickColor, tooltipBg, tooltipBorder } = useChartColors();

  return (
    <AppCard>
      <div className="mb-4">
        <h2 className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
          Spending by category
        </h2>
        <p className="text-xs text-text-muted dark:text-text-dark-muted">Current month</p>
      </div>

      {isLoading && <Skeleton className="h-[280px] w-full" />}

      {isError && (
        <EmptyState
          icon={BarChart2}
          title="Couldn't load chart"
          description="Refresh to try again."
        />
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState
          icon={BarChart2}
          title="No spending data"
          description="Add expenses to see category breakdown."
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="categoryName"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: tickColor }}
              tickFormatter={(name: string) => name.split(' ')[0]}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: tickColor }}
              tickFormatter={(v: number) => '₹' + (v / 1000).toFixed(0) + 'k'}
            />
            <Tooltip
              content={<ChartTooltip tooltipBg={tooltipBg} tooltipBorder={tooltipBorder} />}
              cursor={{ fill: gridColor, opacity: 0.2 }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.categoryColourHex} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </AppCard>
  );
}
