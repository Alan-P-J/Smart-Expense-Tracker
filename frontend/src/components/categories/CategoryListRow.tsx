import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';

import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import type { CategoryView } from './CategoryCard';
import type { CategoryResponse } from '../../types';

const COLS =
  'grid grid-cols-[200px_minmax(120px,1fr)_120px_minmax(140px,1.2fr)_120px_120px_70px]';

interface CategoryListRowProps {
  view: CategoryView;
  isAdmin: boolean;
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
  onSelect: (view: CategoryView) => void;
}

export function CategoryListRow({ view, isAdmin, onEdit, onDelete, onSelect }: CategoryListRowProps) {
  const { category: cat, spent, budget, count, delta, lastUsed } = view;
  const Icon = getCategoryIcon(cat.iconName);
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const overBudget = budget > 0 && spent > budget;
  const color = cat.colourHex || '#5B5CF0';
  const barColor = overBudget ? '#EF4444' : pct > 80 ? '#F59E0B' : color;

  return (
    <button
      type="button"
      onClick={() => onSelect(view)}
      className={
        COLS +
        ' w-full text-left items-center px-4 h-[68px] border-t border-border dark:border-[#1F2A44] first:border-t-0 ' +
        'hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition group'
      }
    >
      <div className="flex items-center gap-3 min-w-0 pr-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: color + '22', color }}
          aria-hidden="true"
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">{cat.name}</div>
          <div className="text-[11px] text-text-muted dark:text-[#94A3B8]">{cat.isDefault ? 'Default' : 'Custom'}</div>
        </div>
      </div>
      <div className="text-[13px] text-text-primary dark:text-[#F5F7FF] tnum">
        <span className="font-semibold">{count}</span>
        <span className="text-text-muted dark:text-[#94A3B8] text-[11.5px]"> txns</span>
      </div>
      <div className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF] tnum">{formatCurrency(spent)}</div>
      <div className="pr-4">
        <div className="flex items-center justify-between mb-1">
          <span
            className={
              'text-[11.5px] tnum font-semibold ' +
              (overBudget ? 'text-danger' : 'text-text-muted dark:text-[#94A3B8]')
            }
          >
            {budget > 0 ? `${pct}%` : '—'}
          </span>
          <span className="text-[11px] text-text-muted dark:text-[#94A3B8] tnum">
            {budget > 0 ? formatCurrency(budget) : '—'}
          </span>
        </div>
        <div className="h-[5px] rounded-full bg-surface-muted dark:bg-[#121B32] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${budget > 0 ? Math.min(pct, 100) : 0}%`, background: barColor }}
          />
        </div>
      </div>
      <div>
        {delta !== 0 ? (
          <span
            className={
              'inline-flex items-center gap-1 h-[22px] px-2 rounded-md text-[11.5px] font-semibold tnum ' +
              (delta > 0 ? 'text-success bg-success-soft' : 'text-warning bg-warning-soft')
            }
          >
            {delta > 0 ? <ArrowUp size={10} aria-hidden="true" /> : <ArrowDown size={10} aria-hidden="true" />}{' '}
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : (
          <span className="text-[12px] text-text-muted dark:text-[#94A3B8]">—</span>
        )}
      </div>
      <div className="text-[12px] text-text-muted dark:text-[#94A3B8]">{lastUsed ?? '—'}</div>
      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
        {isAdmin && (
          <>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(cat);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(cat);
                }
              }}
              aria-label={`Edit ${cat.name}`}
              className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#1F2A44] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center cursor-pointer"
            >
              <Pencil size={14} aria-hidden="true" />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (!cat.isDefault) onDelete(cat);
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !cat.isDefault) {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(cat);
                }
              }}
              aria-label={`Delete ${cat.name}`}
              className={
                'w-8 h-8 rounded-lg transition flex items-center justify-center ' +
                (cat.isDefault
                  ? 'opacity-40 cursor-not-allowed text-text-muted dark:text-[#94A3B8]'
                  : 'hover:bg-danger/10 text-text-muted dark:text-[#94A3B8] hover:text-danger cursor-pointer')
              }
            >
              <Trash2 size={14} aria-hidden="true" />
            </span>
          </>
        )}
      </div>
    </button>
  );
}

export const CATEGORY_LIST_COLS = COLS;
