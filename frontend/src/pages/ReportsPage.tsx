import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowUp,
  BarChart3,
  Calendar,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  Tag as TagIcon,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CategoryChip } from '../components/ui/CategoryChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { dashboardService } from '../api/services/dashboardService';
import { reportsService } from '../api/services/reportsService';
import { exportService } from '../api/services/exportService';
import { formatCurrency } from '../lib/format';
import type {
  CategorySpendResponse,
  DayOfWeekSpendResponse,
  RecentExpenseResponse,
  ReportSummaryResponse,
} from '../types';

// ────────────────────────────────────────────────────────────
// Date helpers — convert filter selections to ISO yyyy-MM-dd
// bounds the backend already understands.
// ────────────────────────────────────────────────────────────

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rangeFor(year: number, month: number | null): { from: string; to: string } {
  if (month == null) {
    return {
      from: isoDate(new Date(year, 0, 1)),
      to: isoDate(new Date(year, 11, 31)),
    };
  }
  return {
    from: isoDate(new Date(year, month - 1, 1)),
    to: isoDate(new Date(year, month, 0)), // day 0 of next month = last day of this month
  };
}

// ────────────────────────────────────────────────────────────
// Reusable card
// ────────────────────────────────────────────────────────────

interface ReportCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function ReportCard({ title, subtitle, action, children, className = '' }: ReportCardProps) {
  return (
    <div
      className={
        'fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] ' +
        'p-5 sm:p-6 shadow-card flex flex-col ' +
        className
      }
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && (
              <h3 className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[12.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Filter bar
// ────────────────────────────────────────────────────────────

interface ReportFiltersProps {
  year: number;
  month: number | null;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number | null) => void;
}

const SELECT_CLS =
  'appearance-none w-full h-10 px-3 pr-9 rounded-lg bg-surface-muted dark:bg-[#121B32] ' +
  'border border-border dark:border-[#2D3956] text-[13px] text-text-primary dark:text-[#F5F7FF] ' +
  'focus:border-accent/60 focus:outline-none transition cursor-pointer';

const PILL_BASE = 'h-9 px-3.5 rounded-lg text-[12.5px] font-semibold transition border';

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        PILL_BASE + ' ' +
        (active
          ? 'bg-accent-soft text-accent border-accent/25'
          : 'bg-surface-muted dark:bg-[#121B32] text-text-muted dark:text-[#94A3B8] border-border dark:border-[#2D3956] hover:text-text-primary dark:hover:text-[#F5F7FF]')
      }
    >
      {children}
    </button>
  );
}

function ReportFilters({ year, month, onYearChange, onMonthChange }: ReportFiltersProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  // Default span: 2 years back through 1 year ahead. If the currently selected
  // year falls outside that window (e.g. data lives in 2023), splice it in so
  // the dropdown can still display it.
  const years = useMemo(() => {
    const base = new Set([currentYear - 2, currentYear - 1, currentYear, currentYear + 1, year]);
    return [...base].sort((a, b) => a - b);
  }, [currentYear, year]);

  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const isThisMonth = year === currentYear && month === currentMonth;
  const isLastMonth = year === lastMonthYear && month === lastMonth;
  const isThisYear = year === currentYear && month === null;

  return (
    <ReportCard>
      <div className="flex flex-wrap items-end gap-4 sm:gap-5">
        <label className="flex flex-col gap-1.5 w-28">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
            Year
          </span>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className={SELECT_CLS}
              aria-label="Year"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5 w-40">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
            Month
          </span>
          <div className="relative">
            <select
              value={month ?? ''}
              onChange={(e) => onMonthChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              className={SELECT_CLS}
              aria-label="Month"
            >
              <option value="">Full year</option>
              {MONTHS_FULL.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
            Quick range
          </span>
          <div className="flex flex-wrap gap-2">
            <Pill
              active={isThisMonth}
              onClick={() => {
                onYearChange(currentYear);
                onMonthChange(currentMonth);
              }}
            >
              This month
            </Pill>
            <Pill
              active={isLastMonth}
              onClick={() => {
                onYearChange(lastMonthYear);
                onMonthChange(lastMonth);
              }}
            >
              Last month
            </Pill>
            <Pill
              active={isThisYear}
              onClick={() => {
                onYearChange(currentYear);
                onMonthChange(null);
              }}
            >
              This year
            </Pill>
          </div>
        </div>
      </div>
    </ReportCard>
  );
}

// ────────────────────────────────────────────────────────────
// Summary strip
// ────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: typeof Wallet;
  iconColor: string;
  label: string;
  value: React.ReactNode;
  sub?: string;
  isLoading?: boolean;
}

function MetricCard({ icon: Icon, iconColor, label, value, sub, isLoading }: MetricCardProps) {
  return (
    <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconColor + '1F', color: iconColor }}
          aria-hidden="true"
        >
          <Icon size={15} />
        </div>
        <div className="text-[12px] font-medium text-text-muted dark:text-[#94A3B8] truncate">
          {label}
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <div className="text-[20px] font-bold text-text-primary dark:text-[#F5F7FF] tnum tracking-tight truncate">
          {value}
        </div>
      )}
      {sub && !isLoading && (
        <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate">{sub}</div>
      )}
    </div>
  );
}

function ReportSummary({
  data,
  isLoading,
}: {
  data?: ReportSummaryResponse;
  isLoading: boolean;
}) {
  const largestTitle = data?.largestExpense?.title ?? '—';
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <MetricCard
        icon={TagIcon}
        iconColor="#5B5CF0"
        label="Total expenses"
        value={data?.totalCount ?? '—'}
        isLoading={isLoading}
      />
      <MetricCard
        icon={Wallet}
        iconColor="#10B981"
        label="Total amount"
        value={data ? formatCurrency(data.totalAmount) : '—'}
        isLoading={isLoading}
      />
      <MetricCard
        icon={Calendar}
        iconColor="#38BDF8"
        label="Daily average"
        value={data ? formatCurrency(data.avgPerDay) : '—'}
        sub="per day in period"
        isLoading={isLoading}
      />
      <MetricCard
        icon={CreditCard}
        iconColor="#F59E0B"
        label="Per expense avg"
        value={data ? formatCurrency(data.avgPerExpense) : '—'}
        sub="avg per transaction"
        isLoading={isLoading}
      />
      <MetricCard
        icon={ArrowUp}
        iconColor="#EF4444"
        label="Largest expense"
        value={data?.largestExpense ? formatCurrency(data.largestExpense.amount) : '—'}
        sub={largestTitle.length > 22 ? largestTitle.slice(0, 22) + '…' : largestTitle}
        isLoading={isLoading}
      />
      <MetricCard
        icon={BarChart3}
        iconColor="#8B5CF6"
        label="Most active day"
        value={data?.mostActiveDay ?? '—'}
        sub="most expenses logged"
        isLoading={isLoading}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Monthly comparison chart
// ────────────────────────────────────────────────────────────

interface MonthlyRow {
  m: string;
  total: number;
  idx: number;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function MonthlyTooltip({
  active,
  payload,
  maxIdx,
  year,
}: {
  active?: boolean;
  payload?: Array<{ payload: MonthlyRow }>;
  maxIdx: number;
  year: number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const isMax = p.idx === maxIdx && p.total > 0;
  return (
    <div className="rounded-xl bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 py-2.5 shadow-pop min-w-[160px]">
      <div className="text-[11px] text-text-muted dark:text-[#94A3B8]">{MONTHS_FULL[p.idx]} {year}</div>
      <div className="text-[15px] font-bold text-text-primary dark:text-[#F5F7FF] tnum mt-0.5">
        {formatCurrency(p.total)}
      </div>
      {isMax && (
        <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold text-danger bg-danger/10">
          <ArrowUp size={10} aria-hidden="true" /> Highest month
        </div>
      )}
    </div>
  );
}

function MonthlyComparisonChart({
  year,
  selectedMonth,
  onMonthSelect,
}: {
  year: number;
  selectedMonth: number | null;
  onMonthSelect: (m: number) => void;
}) {
  // Always pull full-year data for the comparison view, regardless of the
  // page's month filter — that's the chart's whole purpose.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'monthly', year],
    queryFn: () => dashboardService.getTrends({
      from: isoDate(new Date(year, 0, 1)),
      to: isoDate(new Date(year, 11, 31)),
    }),
  });

  const rows: MonthlyRow[] = useMemo(() => {
    const byKey = new Map<string, number>();
    (data?.months ?? []).forEach((mt) => byKey.set(mt.month, Number(mt.total) || 0));
    return SHORT_MONTHS.map((m, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      return { m, idx: i, total: byKey.get(key) ?? 0 };
    });
  }, [data, year]);

  const nonZero = rows.filter((r) => r.total > 0);
  const avg = nonZero.length > 0 ? nonZero.reduce((s, r) => s + r.total, 0) / nonZero.length : 0;
  const maxIdx = rows.reduce((best, r, i) => (r.total > rows[best].total ? i : best), 0);

  return (
    <ReportCard
      title="Monthly comparison"
      subtitle={`${year} — click a bar to filter`}
    >
      {isLoading && <Skeleton className="h-[280px] w-full" />}
      {isError && <EmptyState icon={BarChart3} title="Couldn't load chart" description="Refresh to try again." />}
      {!isLoading && !isError && (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              margin={{ top: 12, right: 28, left: 4, bottom: 6 }}
              onClick={(state) => {
                const i = (state as { activeTooltipIndex?: number } | null)?.activeTooltipIndex;
                if (i != null && rows[i].total > 0) onMonthSelect(i + 1);
              }}
            >
              <CartesianGrid stroke="var(--c-chart-grid)" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} dy={6} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => (v === 0 ? '₹0' : '₹' + (v / 1000).toFixed(0) + 'K')}
              />
              <Tooltip
                cursor={{ fill: 'rgba(91, 92, 240, 0.08)', radius: 6 }}
                content={<MonthlyTooltip maxIdx={maxIdx} year={year} />}
              />
              {avg > 0 && (
                <ReferenceLine
                  y={avg}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: 'Avg', position: 'right', fill: '#F59E0B', fontSize: 11, fontWeight: 600 }}
                />
              )}
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={56} cursor="pointer" isAnimationActive animationDuration={900}>
                {rows.map((r, i) => {
                  const isSelected = selectedMonth === i + 1;
                  const isEmpty = r.total === 0;
                  const fill = isEmpty ? 'rgba(148, 163, 184, 0.18)' : isSelected ? '#5B5CF0' : '#94A3B8';
                  return <Cell key={i} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ReportCard>
  );
}

// ────────────────────────────────────────────────────────────
// Category breakdown — donut + ranked list
// ────────────────────────────────────────────────────────────

const FALLBACK_COLORS = ['#5B5CF0', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

function CategoryBreakdown({
  range,
  periodLabel,
}: {
  range: { from: string; to: string };
  periodLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'by-category', range.from, range.to],
    queryFn: () => dashboardService.getByCategory(range),
  });

  const slices = useMemo(() => {
    const list = (data ?? [])
      .map((c: CategorySpendResponse, i: number) => ({
        name: c.categoryName,
        amount: Number(c.total) || 0,
        color: c.categoryColourHex || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return list;
  }, [data]);

  const total = slices.reduce((s, c) => s + c.amount, 0);
  const max = slices[0]?.amount ?? 0;
  const visible = showAll ? slices : slices.slice(0, 7);

  return (
    <ReportCard title="Spending by category" subtitle={periodLabel}>
      {isLoading && <Skeleton className="h-[260px] w-full" />}
      {isError && <EmptyState icon={BarChart3} title="Couldn't load breakdown" description="Refresh to try again." />}
      {!isLoading && !isError && slices.length === 0 && (
        <EmptyState icon={BarChart3} title="No spending in this period" description="Choose a different range to see categories." />
      )}
      {!isLoading && !isError && slices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="relative w-full h-[240px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={102}
                  paddingAngle={2}
                  stroke="none"
                  onMouseEnter={(_, i) => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  isAnimationActive
                  animationDuration={900}
                >
                  {slices.map((s, i) => (
                    <Cell
                      key={s.name}
                      fill={s.color}
                      opacity={active == null || active === i ? 1 : 0.4}
                      style={{
                        filter: active === i ? `drop-shadow(0 0 14px ${s.color}66)` : 'none',
                        transition: 'opacity .2s, filter .2s',
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[10.5px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
                {active != null ? slices[active].name : 'Total'}
              </div>
              <div className="text-[19px] font-bold text-text-primary dark:text-[#F5F7FF] tnum mt-1">
                {formatCurrency(active != null ? slices[active].amount : total)}
              </div>
              {active != null && (
                <div className="text-[11px] text-text-muted dark:text-[#94A3B8] mt-0.5 tnum">
                  {((slices[active].amount / total) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {visible.map((c) => {
              const pct = (c.amount / total) * 100;
              const barPct = max > 0 ? (c.amount / max) * 100 : 0;
              return (
                <div
                  key={c.name}
                  onMouseEnter={() => setActive(slices.indexOf(c))}
                  onMouseLeave={() => setActive(null)}
                  className="flex items-center gap-3"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="text-[12.5px] font-medium text-text-primary dark:text-[#F5F7FF] w-[100px] shrink-0 truncate">
                    {c.name}
                  </span>
                  <div className="flex-1 h-[6px] rounded-full bg-surface-muted dark:bg-[#121B32] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barPct}%`, background: c.color }}
                    />
                  </div>
                  <span className="text-[12.5px] text-text-primary dark:text-[#F5F7FF] tnum font-medium w-[78px] text-right">
                    {formatCurrency(c.amount)}
                  </span>
                  <span className="text-[11px] text-text-muted dark:text-[#94A3B8] tnum w-[42px] text-right">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
            {slices.length > 7 && (
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="self-start mt-1 text-[12px] font-semibold text-accent hover:opacity-80 transition inline-flex items-center gap-1"
              >
                {showAll ? 'Show less' : `+${slices.length - 7} more`}
                <ChevronDown
                  size={12}
                  className={'transition-transform ' + (showAll ? 'rotate-180' : '')}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </div>
      )}
    </ReportCard>
  );
}

// ────────────────────────────────────────────────────────────
// Day-of-week chart
// ────────────────────────────────────────────────────────────

function DayTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { day: string; amount: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl bg-white dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-3 py-2 shadow-pop">
      <div className="text-[11px] text-text-muted dark:text-[#94A3B8]">{p.day}</div>
      <div className="text-[13.5px] font-bold text-text-primary dark:text-[#F5F7FF] tnum">
        {formatCurrency(p.amount)}
      </div>
    </div>
  );
}

function SpendingByDayChart({ range }: { range: { from: string; to: string } }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'by-day-of-week', range.from, range.to],
    queryFn: () => reportsService.getByDayOfWeek(range),
  });

  const rows = useMemo(
    () =>
      (data ?? []).map((d: DayOfWeekSpendResponse) => ({
        day: d.day,
        amount: Number(d.amount) || 0,
      })),
    [data],
  );

  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.amount)) : 0;
  const hasAny = rows.some((r) => r.amount > 0);

  return (
    <ReportCard title="Spending by day of week" subtitle="Which days you spend the most">
      {isLoading && <Skeleton className="h-[280px] w-full" />}
      {isError && <EmptyState icon={BarChart3} title="Couldn't load chart" description="Refresh to try again." />}
      {!isLoading && !isError && !hasAny && (
        <EmptyState icon={BarChart3} title="No expenses in this period" description="Day-of-week trends need expenses to compute." />
      )}
      {!isLoading && !isError && hasAny && (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 6, right: 70, left: 4, bottom: 6 }}>
              <defs>
                <linearGradient id="dayGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#5B5CF0" stopOpacity="1" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--c-chart-grid)" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v === 0 ? '₹0' : '₹' + (v / 1000).toFixed(0) + 'K')}
              />
              <YAxis
                type="category"
                dataKey="day"
                axisLine={false}
                tickLine={false}
                width={38}
                tick={(props) => {
                  const value = props.payload?.value ?? '';
                  const isMax = rows.find((d) => d.day === value)?.amount === max;
                  return (
                    <text
                      x={Number(props.x ?? 0)}
                      y={Number(props.y ?? 0)}
                      dy={4}
                      textAnchor="end"
                      fill={isMax ? '#5B5CF0' : 'var(--c-chart-tick)'}
                      fontSize={11}
                      fontWeight={isMax ? 700 : 500}
                    >
                      {value}
                    </text>
                  );
                }}
              />
              <Tooltip cursor={{ fill: 'rgba(91, 92, 240, 0.08)' }} content={<DayTooltip />} />
              <Bar
                dataKey="amount"
                radius={[0, 6, 6, 0]}
                maxBarSize={26}
                fill="url(#dayGrad)"
                isAnimationActive
                animationDuration={900}
              >
                <LabelList
                  dataKey="amount"
                  position="right"
                  formatter={(v) => formatCurrency(typeof v === 'number' ? v : Number(v ?? 0))}
                  style={{ fill: 'rgb(var(--c-text-dim))', fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ReportCard>
  );
}

// ────────────────────────────────────────────────────────────
// Top expenses table
// ────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1 ? { bg: 'rgba(245, 158, 11, 0.16)', fg: '#F59E0B', border: 'rgba(245, 158, 11, 0.35)' } :
    rank === 2 ? { bg: 'rgba(148, 163, 184, 0.16)', fg: '#CBD5E1', border: 'rgba(148, 163, 184, 0.35)' } :
    rank === 3 ? { bg: 'rgba(249, 115, 22, 0.16)', fg: '#FB923C', border: 'rgba(249, 115, 22, 0.35)' } :
    null;
  if (!styles) {
    return <span className="text-[12px] text-text-muted dark:text-[#94A3B8] tnum font-medium">#{rank}</span>;
  }
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11.5px] font-bold tnum border"
      style={{ background: styles.bg, color: styles.fg, borderColor: styles.border }}
    >
      {rank}
    </span>
  );
}

function TopExpensesTable({ range }: { range: { from: string; to: string } }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'top-expenses', range.from, range.to],
    queryFn: () => reportsService.getTopExpenses(range, 10),
  });

  const rows = data ?? [];

  return (
    <ReportCard title="Top expenses" subtitle="Highest individual transactions">
      {isLoading && <Skeleton className="h-[280px] w-full" />}
      {isError && <EmptyState icon={BarChart3} title="Couldn't load list" description="Refresh to try again." />}
      {!isLoading && !isError && rows.length === 0 && (
        <EmptyState icon={BarChart3} title="No expenses in this period" description="Adjust the filter to see top transactions." />
      )}
      {!isLoading && !isError && rows.length > 0 && (
        <div className="-mx-5 sm:-mx-6 overflow-x-auto">
          <div className="px-5 sm:px-6 min-w-[600px]">
            <div className="grid grid-cols-[48px_1.8fr_0.9fr_0.9fr_0.8fr] px-3 pb-3 text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] border-b border-border dark:border-[#1F2A44]">
              <div>Rank</div>
              <div>Title</div>
              <div>Category</div>
              <div>Date</div>
              <div className="text-right">Amount</div>
            </div>
            <div>
              {rows.map((r: RecentExpenseResponse, i: number) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[48px_1.8fr_0.9fr_0.9fr_0.8fr] items-center px-3 h-[56px] hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition rounded-lg border-t border-border dark:border-[#1F2A44] first:border-t-0"
                >
                  <div><RankBadge rank={i + 1} /></div>
                  <div className="text-[13.5px] font-medium text-text-primary dark:text-[#F5F7FF] truncate pr-3">
                    {r.title}
                  </div>
                  <div>
                    <CategoryChip name={r.categoryName} color={r.categoryColourHex || '#94A3B8'} />
                  </div>
                  <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8] tnum">
                    {format(parseISO(r.expenseDate), 'dd MMM yyyy')}
                  </div>
                  <div className="text-right text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] tnum">
                    {formatCurrency(r.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ReportCard>
  );
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export function ReportsPage() {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number | null>(today.getMonth() + 1);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  // Anchor the initial year/month to the most-recent expense so the page
  // doesn't load empty when "this month" has no data yet. The user can still
  // switch the dropdowns freely after this one-shot adjustment.
  const didInitialize = useRef(false);
  const anchor = useQuery({
    queryKey: ['reports', 'init-anchor'],
    queryFn: () => dashboardService.getRecent(),
    staleTime: Infinity,
  });
  useEffect(() => {
    if (didInitialize.current) return;
    if (!anchor.isSuccess) return;
    const latest = anchor.data?.[0];
    if (latest) {
      const d = parseISO(latest.expenseDate);
      if (!Number.isNaN(d.getTime())) {
        setYear(d.getFullYear());
        setMonth(d.getMonth() + 1);
      }
    }
    didInitialize.current = true;
  }, [anchor.isSuccess, anchor.data]);

  const range = useMemo(() => rangeFor(year, month), [year, month]);
  const periodLabel = month ? `${MONTHS_FULL[month - 1]} ${year}` : `Full year — ${year}`;

  const summary = useQuery({
    queryKey: ['reports', 'summary', range.from, range.to],
    queryFn: () => reportsService.getSummary(range),
  });

  const handleExport = async (kind: 'csv' | 'pdf') => {
    setExporting(kind);
    try {
      if (kind === 'csv') await exportService.downloadCsv(range);
      else await exportService.downloadPdf(range);
      toast.success(`${kind.toUpperCase()} export started`);
    } catch {
      toast.error(`Failed to export ${kind.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
            Reports
          </h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-text-muted dark:text-[#94A3B8] mt-1">
            Detailed spending analysis — {periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            className="h-10 px-3 sm:px-3.5 rounded-lg border border-border dark:border-[#2D3956] bg-white dark:bg-[#1A233A] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition inline-flex items-center gap-1.5 sm:gap-2 text-[12.5px] sm:text-[13px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={14} aria-hidden="true" />
            {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="h-10 px-3.5 sm:px-4 rounded-lg text-white text-[12.5px] sm:text-[13px] font-semibold inline-flex items-center gap-1.5 sm:gap-2 transition active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            <FileText size={14} aria-hidden="true" />
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
            <span className="hidden sm:inline">{exporting === 'pdf' ? '' : ' report'}</span>
          </button>
        </div>
      </div>

      <ReportFilters
        year={year}
        month={month}
        onYearChange={setYear}
        onMonthChange={setMonth}
      />

      <ReportSummary data={summary.data} isLoading={summary.isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <MonthlyComparisonChart
          year={year}
          selectedMonth={month}
          onMonthSelect={setMonth}
        />
        <CategoryBreakdown range={range} periodLabel={periodLabel} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <SpendingByDayChart range={range} />
        <TopExpensesTable range={range} />
      </div>

      <div className="h-2" />
    </div>
  );
}
