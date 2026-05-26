import { ArrowDown, ArrowRight, ArrowUp, Pencil, Trash2 } from 'lucide-react';

import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import type { CategoryResponse } from '../../types';

export interface CategoryView {
  category: CategoryResponse;
  spent: number;
  budget: number;
  count: number;
  delta: number;
  lastUsed?: string | null;
}

interface CategoryCardProps {
  view: CategoryView;
  isAdmin: boolean;
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
  onSelect: (view: CategoryView) => void;
  selected?: boolean;
}

export function CategoryCard({ view, isAdmin, onEdit, onDelete, onSelect, selected }: CategoryCardProps) {
  const { category: cat, spent, budget, count, delta, lastUsed } = view;
  const Icon = getCategoryIcon(cat.iconName);
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const overBudget = budget > 0 && spent > budget;
  const color = cat.colourHex || '#5B5CF0';
  const barColor = overBudget ? '#EF4444' : pct > 80 ? '#F59E0B' : color;

  return (
    <div
      className={
        'fade-up group relative rounded-2xl bg-white dark:bg-[#1A233A] border p-5 shadow-card ' +
        'hover:-translate-y-0.5 transition-all duration-200 ' +
        (selected
          ? 'border-accent/50 shadow-glow'
          : 'border-border dark:border-[#1F2A44] hover:border-border-strong dark:hover:border-[#2D3956]')
      }
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: color + '22', color }}
          aria-hidden="true"
        >
          <Icon size={22} style={{ color }} />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(cat);
              }}
              aria-label={`Edit ${cat.name}`}
              className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!cat.isDefault) onDelete(cat);
              }}
              disabled={cat.isDefault}
              aria-label={`Delete ${cat.name}`}
              title={cat.isDefault ? 'Default categories cannot be deleted' : undefined}
              className={
                'w-8 h-8 rounded-lg transition flex items-center justify-center ' +
                (cat.isDefault
                  ? 'opacity-40 cursor-not-allowed text-text-muted dark:text-[#94A3B8]'
                  : 'hover:bg-danger/10 text-text-muted dark:text-[#94A3B8] hover:text-danger')
              }
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Name + type chip */}
      <div className="flex items-center gap-2 mb-3.5">
        <button type="button" onClick={() => onSelect(view)} className="text-left">
          <h3 className="text-[16px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">{cat.name}</h3>
        </button>
        <span
          className={
            'inline-flex items-center h-5 px-1.5 rounded text-[10px] font-semibold uppercase tracking-wider ' +
            (cat.isDefault
              ? 'text-text-muted dark:text-[#94A3B8] bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44]'
              : 'text-accent bg-accent-soft border border-accent/20')
          }
        >
          {cat.isDefault ? 'Default' : 'Custom'}
        </span>
      </div>

      {/* Spent + delta (sparkline removed — was synthetic). */}
      <div className="flex items-end justify-between mb-3.5">
        <div className="min-w-0">
          <div className="text-[19px] font-bold text-text-primary dark:text-[#F5F7FF] tnum tracking-tight">
            {formatCurrency(spent)}
          </div>
          <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] flex items-center gap-1.5">
            <span>spent</span>
            <span className="text-text-muted/60 dark:text-[#94A3B8]/60">·</span>
            <span className="tnum">{count} txns</span>
          </div>
        </div>
        {delta !== 0 && (
          <span
            className={
              'text-[11px] font-semibold tnum inline-flex items-center gap-0.5 shrink-0 ' +
              (delta > 0 ? 'text-success' : 'text-warning')
            }
          >
            {delta > 0 ? <ArrowUp size={10} aria-hidden="true" /> : <ArrowDown size={10} aria-hidden="true" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Budget bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11.5px] text-text-muted dark:text-[#94A3B8]">Budget</span>
          <span className="text-[11.5px] tnum">
            <span
              className={
                'font-semibold ' + (overBudget ? 'text-danger' : 'text-text-primary dark:text-[#F5F7FF]')
              }
            >
              {budget > 0 ? `${pct}%` : '—'}
            </span>
            <span className="text-text-muted dark:text-[#94A3B8]"> of {budget > 0 ? formatCurrency(budget) : '—'}</span>
          </span>
        </div>
        <div className="h-[6px] rounded-full bg-surface-muted dark:bg-[#121B32] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${budget > 0 ? Math.min(pct, 100) : 0}%`,
              background: barColor,
              boxShadow: `0 0 12px ${barColor}55`,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3.5 pt-3 border-t border-border dark:border-[#1F2A44] flex items-center justify-between text-[11px] text-text-muted dark:text-[#94A3B8]">
        <span>{lastUsed ? `Last used ${lastUsed}` : 'No recent activity'}</span>
        <button
          type="button"
          onClick={() => onSelect(view)}
          className="inline-flex items-center gap-1 text-accent hover:opacity-80 transition font-semibold"
        >
          View <ArrowRight size={11} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
