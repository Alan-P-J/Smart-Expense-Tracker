import { AlertCircle, AlertTriangle, Pencil } from 'lucide-react';

import { Sparkline, seriesFor } from '../ui/Sparkline';
import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import type { BudgetResponse } from '../../types';

interface BudgetCardProps {
  budget: BudgetResponse;
  categoryIconName?: string | null;
  isAdmin: boolean;
  onEdit: (budget: BudgetResponse) => void;
  onSelect: (budget: BudgetResponse) => void;
}

const MONTH_DAYS = 30;

function elapsedDaysOfMonth(): number {
  const today = new Date();
  return Math.max(today.getDate(), 1);
}

function daysLeftOfMonth(): number {
  const today = new Date();
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Math.max(last - today.getDate(), 0);
}

export function BudgetCard({ budget, categoryIconName, isAdmin, onEdit, onSelect }: BudgetCardProps) {
  const Icon = getCategoryIcon(categoryIconName);
  const spent = Number(budget.spent);
  const limit = Number(budget.monthlyLimit);
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const overAmount = Math.max(spent - limit, 0);
  const remaining = Math.max(limit - spent, 0);
  const overBudget = budget.isOverBudget;
  const warn = !overBudget && pct >= 80;

  const color = budget.categoryColourHex || '#5B5CF0';
  const barColor = overBudget ? '#EF4444' : warn ? '#F59E0B' : color;

  const elapsed = elapsedDaysOfMonth();
  const daysLeft = daysLeftOfMonth();
  const dailyAvg = Math.round(spent / elapsed);
  const projected = Math.round(dailyAvg * MONTH_DAYS);
  const offTrack = projected > limit;

  // Trend is a visual mock — backend doesn't track per-day budget series yet.
  const trend = seriesFor(Math.max(spent / 7, 100), 0.25, 7);

  return (
    <div
      onClick={() => onSelect(budget)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(budget);
        }
      }}
      className={
        'fade-up group rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] ' +
        'p-5 shadow-card hover:border-border-strong dark:hover:border-[#2D3956] hover:-translate-y-0.5 ' +
        'transition-all duration-200 cursor-pointer'
      }
    >
      {/* Top row: icon + name + edit/over-pill */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: color + '22', color }}
            aria-hidden="true"
          >
            <Icon size={20} style={{ color }} />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-text-primary dark:text-[#F5F7FF] truncate">
              {budget.categoryName}
            </div>
            <div className="text-[11px] text-text-muted dark:text-[#94A3B8]">Monthly</div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition">
          {overBudget && (
            <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-md text-[10.5px] font-bold text-danger bg-danger/10 border border-danger/30 uppercase tracking-wider">
              <AlertCircle size={11} /> Over
            </span>
          )}
          {warn && (
            <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-md text-[10.5px] font-bold text-warning bg-warning/10 border border-warning/30 uppercase tracking-wider">
              <AlertTriangle size={11} /> 80%+
            </span>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(budget);
              }}
              aria-label={`Edit ${budget.categoryName} budget`}
              className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Spent vs limit */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={'text-[22px] font-bold tnum tracking-tight ' + (overBudget ? 'text-danger' : 'text-text-primary dark:text-[#F5F7FF]')}>
          {formatCurrency(spent)}
        </span>
        <span className="text-[13px] text-text-muted dark:text-[#94A3B8] tnum">/ {formatCurrency(limit)}</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-[8px] rounded-full bg-surface-muted dark:bg-[#121B32] overflow-hidden mb-2">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: barColor,
            boxShadow: `0 0 12px ${barColor}55`,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[11.5px] mb-4">
        <span className={'font-semibold tnum ' + (overBudget ? 'text-danger' : 'text-text-muted dark:text-[#94A3B8]')}>
          {Math.round(pct)}% used
        </span>
        <span className={'tnum ' + (overBudget ? 'text-danger' : 'text-text-muted dark:text-[#94A3B8]')}>
          {overBudget ? `${formatCurrency(overAmount)} over limit` : `${formatCurrency(remaining)} remaining`}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-border dark:border-[#1F2A44]">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted dark:text-[#94A3B8]">Daily avg</div>
          <div className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF] tnum mt-0.5">
            {formatCurrency(dailyAvg)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted dark:text-[#94A3B8]">Forecast</div>
          <div
            className={
              'text-[13px] font-semibold tnum mt-0.5 ' +
              (offTrack ? 'text-warning' : 'text-text-primary dark:text-[#F5F7FF]')
            }
          >
            {formatCurrency(projected)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted dark:text-[#94A3B8]">Days left</div>
          <div className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF] tnum mt-0.5">{daysLeft}</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-text-muted dark:text-[#94A3B8]">7-day trend</span>
        <Sparkline data={trend} color={color} />
      </div>
    </div>
  );
}
