import { X } from 'lucide-react';
import type { ExpenseFiltersState } from './ExpenseFilterBar';
import type { CategoryResponse } from '../../types';

interface ActiveFilterChipsProps {
  filters: ExpenseFiltersState;
  categories: CategoryResponse[];
  count: number;
  total: number;
  onChange: <K extends keyof ExpenseFiltersState>(key: K, value: ExpenseFiltersState[K]) => void;
  onClear: () => void;
}

interface Chip {
  key: string;
  label: string;
  reset: () => void;
}

export function ActiveFilterChips({ filters, categories, count, total, onChange, onClear }: ActiveFilterChipsProps) {
  const chips: Chip[] = [];
  if (filters.search) {
    chips.push({ key: 'search', label: `"${filters.search}"`, reset: () => onChange('search', '') });
  }
  if (filters.categoryId != null) {
    const cat = categories.find((c) => c.id === filters.categoryId);
    chips.push({ key: 'category', label: `Category: ${cat?.name ?? filters.categoryId}`, reset: () => onChange('categoryId', null) });
  }
  if (filters.status !== 'All') {
    chips.push({ key: 'status', label: `Status: ${filters.status}`, reset: () => onChange('status', 'All') });
  }
  if (filters.from) {
    chips.push({ key: 'from', label: `From: ${filters.from}`, reset: () => onChange('from', '') });
  }
  if (filters.to) {
    chips.push({ key: 'to', label: `To: ${filters.to}`, reset: () => onChange('to', '') });
  }

  if (chips.length === 0) {
    return (
      <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8]">
        Showing all <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{total}</span>{' '}
        {total === 1 ? 'expense' : 'expenses'}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12.5px] text-text-muted dark:text-[#94A3B8]">
        Showing <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{count}</span> of{' '}
        <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{total}</span>
      </span>
      <span className="text-text-muted dark:text-[#94A3B8]">·</span>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.reset}
          className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-md bg-accent-soft text-accent text-[12px] font-medium border border-accent/20 hover:bg-accent/15 transition"
        >
          {c.label}
          <span className="w-4 h-4 rounded-full hover:bg-accent/30 flex items-center justify-center transition">
            <X size={10} aria-hidden="true" />
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="h-7 px-2 rounded-md text-[12px] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition"
      >
        Clear all
      </button>
    </div>
  );
}
