import { AlertCircle, ArrowUp, Tag, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { formatCurrency } from '../../lib/format';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: LucideIcon;
  iconColor: string;
}

function StatTile({ label, value, sub, icon: Icon, iconColor }: StatTileProps) {
  return (
    <div className="fade-up rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-4 sm:p-5 shadow-card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-medium text-text-muted dark:text-[#94A3B8]">{label}</div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: iconColor + '1f', color: iconColor }}
          aria-hidden="true"
        >
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="text-[20px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight tnum truncate">
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate">{sub}</div>}
    </div>
  );
}

interface CategoriesStatsProps {
  total: number;
  defaultCount: number;
  customCount: number;
  totalSpent: number;
  totalBudget: number;
  topCategoryName: string | null;
  topCategoryAmount: number;
  overBudgetCount: number;
}

export function CategoriesStats({
  total,
  defaultCount,
  customCount,
  totalSpent,
  totalBudget,
  topCategoryName,
  topCategoryAmount,
  overBudgetCount,
}: CategoriesStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatTile
        label="Total categories"
        value={total}
        sub={`${defaultCount} default · ${customCount} custom`}
        icon={Tag}
        iconColor="#5B5CF0"
      />
      <StatTile
        label="Total spend"
        value={formatCurrency(totalSpent)}
        sub={totalBudget > 0 ? `of ${formatCurrency(totalBudget)} budgeted` : 'No budgets set'}
        icon={Wallet}
        iconColor="#10B981"
      />
      <StatTile
        label="Highest category"
        value={topCategoryName ?? '—'}
        sub={topCategoryName ? formatCurrency(topCategoryAmount) : '—'}
        icon={ArrowUp}
        iconColor="#F59E0B"
      />
      <StatTile
        label="Over budget"
        value={overBudgetCount}
        sub={overBudgetCount > 0 ? `${total - overBudgetCount} on track` : 'All within limits'}
        icon={AlertCircle}
        iconColor={overBudgetCount > 0 ? '#EF4444' : '#10B981'}
      />
    </div>
  );
}
