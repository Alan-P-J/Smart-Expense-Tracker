import { useEffect } from 'react';
import { ArrowDown, ArrowUp, Pencil, X } from 'lucide-react';

import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import type { CategoryView } from './CategoryCard';
import type { CategoryResponse } from '../../types';

interface CategoryDrawerProps {
  view: CategoryView | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (cat: CategoryResponse) => void;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-3">
      <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
        {label}
      </div>
      <div className="text-[13.5px] text-text-primary dark:text-[#F5F7FF] mt-1 font-semibold tnum">{value}</div>
    </div>
  );
}

export function CategoryDrawer({ view, isAdmin, onClose, onEdit }: CategoryDrawerProps) {
  useEffect(() => {
    if (!view) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [view, onClose]);

  if (!view) return null;
  const { category: cat, spent, budget, count, delta, trend, lastUsed } = view;
  const Icon = getCategoryIcon(cat.iconName);
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const overBudget = budget > 0 && spent > budget;
  const color = cat.colourHex || '#5B5CF0';
  const barColor = overBudget ? '#EF4444' : pct > 80 ? '#F59E0B' : color;

  // 7-point trend chart
  const w = 240;
  const h = 70;
  const safeTrend = trend.length > 1 ? trend : [0, 0];
  const min = Math.min(...safeTrend);
  const max = Math.max(...safeTrend);
  const range = max - min || 1;
  const step = w / (safeTrend.length - 1);
  const pts = safeTrend.map((v, i) => `${i * step},${h - ((v - min) / range) * h * 0.85 - 5}`).join(' ');

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
        className="relative w-full max-w-[460px] h-full bg-white dark:bg-[#1A233A] border-l border-border dark:border-[#2D3956] shadow-pop overflow-y-auto"
        style={{ animation: 'fadeUp .35s cubic-bezier(.2,.7,.2,1) both' }}
      >
        <div className="sticky top-0 bg-white/95 dark:bg-[#1A233A]/95 backdrop-blur z-10 px-6 py-4 border-b border-border dark:border-[#1F2A44] flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
            Category details
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
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: color + '22', color }}
              aria-hidden="true"
            >
              <Icon size={26} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[19px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">{cat.name}</h2>
              <span
                className={
                  'inline-flex items-center h-5 px-1.5 rounded text-[10px] font-semibold uppercase tracking-wider mt-1 ' +
                  (cat.isDefault
                    ? 'text-text-muted dark:text-[#94A3B8] bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44]'
                    : 'text-accent bg-accent-soft border border-accent/20')
                }
              >
                {cat.isDefault ? 'Default' : 'Custom'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-4">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
              Spent this month
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tnum tracking-tight">
                {formatCurrency(spent)}
              </span>
              {delta !== 0 && (
                <span
                  className={
                    'text-[12px] font-semibold tnum inline-flex items-center gap-0.5 ' +
                    (delta > 0 ? 'text-success' : 'text-warning')
                  }
                >
                  {delta > 0 ? <ArrowUp size={11} aria-hidden="true" /> : <ArrowDown size={11} aria-hidden="true" />}
                  {Math.abs(delta).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="flex justify-between mb-1.5 text-[11.5px]">
                <span className="text-text-muted dark:text-[#94A3B8]">Budget usage</span>
                <span className={'tnum font-semibold ' + (overBudget ? 'text-danger' : 'text-text-primary dark:text-[#F5F7FF]')}>
                  {budget > 0 ? `${pct}% of ${formatCurrency(budget)}` : 'No budget set'}
                </span>
              </div>
              <div className="h-[6px] rounded-full bg-white dark:bg-[#1F2A44] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${budget > 0 ? Math.min(pct, 100) : 0}%`, background: barColor }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Detail label="Transactions" value={count} />
            <Detail label="Avg per txn" value={count > 0 ? formatCurrency(Math.round(spent / count)) : '—'} />
            <Detail label="Last used" value={lastUsed ?? '—'} />
            <Detail
              label="Color"
              value={
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md" style={{ background: color }} />
                  <span className="font-mono text-[12px]">{color}</span>
                </span>
              }
            />
          </div>

          <div>
            <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] mb-2">
              7-week trend
            </div>
            <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] p-4 flex justify-center">
              <svg width="100%" height="70" viewBox="0 0 240 70" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="cat-trend-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points={`0,${h} ${pts} ${w},${h}`} fill="url(#cat-trend-grad)" stroke="none" />
                <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {safeTrend.map((v, i) => (
                  <circle key={i} cx={i * step} cy={h - ((v - min) / range) * h * 0.85 - 5} r="3" fill={color} stroke="var(--c-dot-stroke)" strokeWidth="2" />
                ))}
              </svg>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onEdit(cat)}
                className="flex-1 h-10 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-2 shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
                style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
              >
                <Pencil size={14} aria-hidden="true" />
                Edit category
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
