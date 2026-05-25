import { ChevronDown, Search } from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';
import type { CategoryResponse } from '../../types';
import type { ExpenseStatus } from './enrichExpense';

export interface ExpenseFiltersState {
  search: string;
  categoryId: number | null;
  status: ExpenseStatus | 'All';
  from: string;  // YYYY-MM-DD or ''
  to: string;
}

interface ExpenseFilterBarProps {
  filters: ExpenseFiltersState;
  categories: CategoryResponse[];
  onChange: <K extends keyof ExpenseFiltersState>(key: K, value: ExpenseFiltersState[K]) => void;
}

const FIELD_LABEL = 'text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]';
const FIELD_INPUT =
  'w-full h-10 rounded-lg bg-surface-muted dark:bg-[#121B32] ' +
  'border border-border dark:border-[#2D3956] px-3 text-[13px] ' +
  'text-text-primary dark:text-[#F5F7FF] ' +
  'placeholder:text-text-muted dark:placeholder:text-[#94A3B8] ' +
  'focus:border-accent/60 focus:outline-none transition';

export function ExpenseFilterBar({ filters, categories, onChange }: ExpenseFilterBarProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-4 sm:p-5 shadow-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-3">
        {/* Search */}
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Search</span>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange('search', e.target.value)}
              placeholder="Title, description…"
              className={FIELD_INPUT + ' pl-9'}
            />
          </div>
        </label>

        {/* Category */}
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Category</span>
          <div className="relative">
            <select
              value={filters.categoryId == null ? '' : String(filters.categoryId)}
              onChange={(e) => onChange('categoryId', e.target.value === '' ? null : Number(e.target.value))}
              className={FIELD_INPUT + ' appearance-none pr-9 cursor-pointer'}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none" aria-hidden="true" />
          </div>
        </label>

        {/* Status */}
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Status</span>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onChange('status', e.target.value as ExpenseFiltersState['status'])}
              className={FIELD_INPUT + ' appearance-none pr-9 cursor-pointer'}
            >
              <option value="All">All status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Draft">Draft</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none" aria-hidden="true" />
          </div>
        </label>

        {/* From */}
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>From</span>
          <DatePicker
            value={filters.from}
            onChange={(v) => onChange('from', v)}
            max={filters.to || undefined}
            placeholder="Start date"
            clearable
            ariaLabel="From date"
          />
        </div>

        {/* To */}
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>To</span>
          <DatePicker
            value={filters.to}
            onChange={(v) => onChange('to', v)}
            min={filters.from || undefined}
            placeholder="End date"
            clearable
            ariaLabel="To date"
          />
        </div>
      </div>
    </div>
  );
}
