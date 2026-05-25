import { useEffect, useState } from 'react';
import { Pencil, X } from 'lucide-react';

import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import { seriesFor } from '../ui/Sparkline';
import type { BudgetResponse } from '../../types';

interface BudgetDrawerProps {
  budget: BudgetResponse | null;
  categoryIconName?: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (budget: BudgetResponse) => void;
}

const MONTH_DAYS = 30;

function elapsedDaysOfMonth(): number {
  return Math.max(new Date().getDate(), 1);
}
function daysLeftOfMonth(): number {
  const today = new Date();
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Math.max(last - today.getDate(), 0);
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-3">
      <div className="text-[10.5px] uppercase tracking-wider text-text-muted dark:text-[#94A3B8]">{label}</div>
      <div className="text-[14px] font-bold text-text-primary dark:text-[#F5F7FF] tnum mt-1">{value}</div>
      {hint && <div className="mt-0.5">{hint}</div>}
    </div>
  );
}

function AlertRow({ defaultOn, label, desc }: { defaultOn?: boolean; label: string; desc: string }) {
  const [enabled, setEnabled] = useState(!!defaultOn);
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF]">{label}</div>
        <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => setEnabled((e) => !e)}
        aria-pressed={enabled}
        aria-label={label}
        className={
          'relative w-10 h-6 rounded-full transition shrink-0 ' +
          (enabled ? 'bg-accent' : 'bg-surface-muted dark:bg-[#1F2A44]')
        }
      >
        <span
          className={
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ' +
            (enabled ? 'left-[18px]' : 'left-0.5')
          }
        />
      </button>
    </div>
  );
}

export function BudgetDrawer({ budget, categoryIconName, isAdmin, onClose, onEdit }: BudgetDrawerProps) {
  useEffect(() => {
    if (!budget) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [budget, onClose]);

  if (!budget) return null;

  const Icon = getCategoryIcon(categoryIconName);
  const spent = Number(budget.spent);
  const limit = Number(budget.monthlyLimit);
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const overBudget = budget.isOverBudget;
  const overAmount = Math.max(spent - limit, 0);
  const remaining = Math.max(limit - spent, 0);
  const color = budget.categoryColourHex || '#5B5CF0';
  const barColor = overBudget ? '#EF4444' : pct > 80 ? '#F59E0B' : color;

  const elapsed = elapsedDaysOfMonth();
  const daysLeft = daysLeftOfMonth();
  const dailyAvg = Math.round(spent / elapsed);
  const projected = Math.round(dailyAvg * MONTH_DAYS);
  const offTrack = projected > limit;

  const trend = seriesFor(Math.max(spent / 7, 100), 0.25, 7);
  const max = Math.max(...trend);
  const w = 280;
  const h = 100;
  const step = trend.length > 1 ? w / (trend.length - 1) : w;
  const points = trend.map((v, i) => `${i * step},${h - (v / max) * h * 0.85 - 5}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close drawer"
        className="absolute inset-0"
        style={{ background: 'rgba(8,16,40,0.55)', backdropFilter: 'blur(4px)' }}
      />
      <aside
        className="relative w-full max-w-[480px] h-full bg-white dark:bg-[#1A233A] border-l border-border dark:border-[#2D3956] shadow-pop overflow-y-auto"
        style={{ animation: 'fadeUp .35s cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div className="sticky top-0 bg-white/95 dark:bg-[#1A233A]/95 backdrop-blur z-10 px-6 py-4 border-b border-border dark:border-[#1F2A44] flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
            Budget details
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Hero */}
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: color + '22', color }}
              aria-hidden="true"
            >
              <Icon size={26} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[19px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
                {budget.categoryName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-semibold uppercase tracking-wider text-text-muted dark:text-[#94A3B8] bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44]">
                  Monthly
                </span>
                {overBudget && (
                  <span className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-semibold uppercase tracking-wider text-danger bg-danger/10 border border-danger/30">
                    Over
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Spent block */}
          <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-4">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
              Spent of {formatCurrency(limit)}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={'text-[26px] font-bold tnum tracking-tight ' + (overBudget ? 'text-danger' : 'text-text-primary dark:text-[#F5F7FF]')}>
                {formatCurrency(spent)}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between mb-1.5 text-[11.5px] tnum">
                <span className={'font-semibold ' + (overBudget ? 'text-danger' : 'text-text-muted dark:text-[#94A3B8]')}>
                  {Math.round(pct)}% used
                </span>
                <span className={'font-semibold ' + (overBudget ? 'text-danger' : 'text-text-primary dark:text-[#F5F7FF]')}>
                  {overBudget ? `${formatCurrency(overAmount)} over` : `${formatCurrency(remaining)} left`}
                </span>
              </div>
              <div className="h-[6px] rounded-full bg-white dark:bg-[#1F2A44] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                />
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Limit" value={formatCurrency(limit)} />
            <Stat label="Spent" value={formatCurrency(spent)} />
            <Stat label="Daily avg" value={formatCurrency(dailyAvg)} />
            <Stat label="Days left" value={daysLeft} />
            <Stat
              label="Forecast"
              value={formatCurrency(projected)}
              hint={
                offTrack ? (
                  <span className="text-warning text-[11px]">↑ {formatCurrency(projected - limit)} over</span>
                ) : (
                  <span className="text-success text-[11px]">On track</span>
                )
              }
            />
            <Stat label="Period" value="This month" />
          </div>

          {/* Trend chart */}
          <div>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] mb-2">
              7-day spend
            </div>
            <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-4">
              <svg width="100%" height="100" viewBox="0 0 280 100" preserveAspectRatio="none" className="overflow-visible" aria-hidden="true">
                <defs>
                  <linearGradient id="bdgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points={`0,${h} ${points} ${w},${h}`} fill="url(#bdgrad)" stroke="none" />
                <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {trend.map((v, i) => (
                  <circle key={i} cx={i * step} cy={h - (v / max) * h * 0.85 - 5} r="3.5" fill={color} stroke="var(--c-dot-stroke)" strokeWidth="2" />
                ))}
              </svg>
            </div>
          </div>

          {/* Alerts */}
          <div>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] mb-2">
              Alert thresholds
            </div>
            <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] divide-y divide-border dark:divide-[#1F2A44]">
              <AlertRow defaultOn label="At 80% used" desc="Notify when budget reaches 80% of limit" />
              <AlertRow defaultOn label="At 100% used" desc="Critical alert when budget is fully consumed" />
              <AlertRow label="Daily over-spend" desc="Notify if daily spend exceeds projected average" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onEdit(budget)}
                className="flex-1 h-10 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-2 shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
                style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
              >
                <Pencil size={14} aria-hidden="true" />
                Edit budget
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg text-[13px] font-semibold text-text-muted dark:text-[#94A3B8] border border-border-strong dark:border-[#2D3956] hover:text-text-primary dark:hover:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32] transition inline-flex items-center gap-2"
            >
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
