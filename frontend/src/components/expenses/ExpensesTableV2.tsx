import { ArrowDown, ArrowUp, ChevronRight, Pencil, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

import { CategoryChip } from '../ui/CategoryChip';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../lib/format';
import { getCategoryIcon } from '../../utils/categoryIconMap';
import type { EnrichedExpense } from './enrichExpense';

export type SortKey = 'date' | 'title' | 'cat' | 'amount';
export type SortDir = 'asc' | 'desc';
export interface SortState { key: SortKey; dir: SortDir }

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSortChange: (next: SortState) => void;
  align?: 'left' | 'right';
}

function SortHeader({ label, sortKey, sort, onSortChange, align = 'left' }: SortHeaderProps) {
  const active = sort.key === sortKey;
  const flip = () =>
    onSortChange({ key: sortKey, dir: active && sort.dir === 'desc' ? 'asc' : 'desc' });
  return (
    <button
      type="button"
      onClick={flip}
      className={
        'flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase transition ' +
        (align === 'right' ? 'justify-end w-full ' : '') +
        (active
          ? 'text-text-primary dark:text-[#F5F7FF]'
          : 'text-text-muted dark:text-[#94A3B8] hover:text-text-secondary dark:hover:text-[#CBD5E1]')
      }
    >
      {label}
      {active ? (
        sort.dir === 'desc'
          ? <ArrowDown size={11} aria-hidden="true" />
          : <ArrowUp size={11} aria-hidden="true" />
      ) : (
        <ArrowDown size={11} className="opacity-30" aria-hidden="true" />
      )}
    </button>
  );
}

// Desktop-only grid. Mobile uses a stacked flex layout (see ExpenseRow).
const GRID = 'grid grid-cols-[88px_minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_120px] items-center gap-3 px-4';

interface RowProps {
  row: EnrichedExpense;
  canEdit: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ExpenseRow({ row, canEdit, onOpen, onEdit, onDelete }: RowProps) {
  const Icon = getCategoryIcon(null);

  const editBtn = canEdit ? (
    <button
      type="button"
      onClick={onEdit}
      title="Edit"
      aria-label="Edit expense"
      className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
    >
      <Pencil size={14} aria-hidden="true" />
    </button>
  ) : null;
  const deleteBtn = canEdit ? (
    <button
      type="button"
      onClick={onDelete}
      title="Delete"
      aria-label="Delete expense"
      className="w-8 h-8 rounded-lg hover:bg-danger/10 text-text-muted dark:text-[#94A3B8] hover:text-danger transition flex items-center justify-center"
    >
      <Trash2 size={14} aria-hidden="true" />
    </button>
  ) : null;
  const viewBtn = (
    <button
      type="button"
      onClick={onOpen}
      title="View"
      aria-label="View expense detail"
      className="w-8 h-8 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition flex items-center justify-center"
    >
      <ChevronRight size={14} aria-hidden="true" />
    </button>
  );

  return (
    <div
      className={
        'border-t border-border dark:border-[#1F2A44] first:border-t-0 ' +
        'hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition group'
      }
    >
      {/* ── Desktop / tablet ≥ md: original 5-column grid ─────────── */}
      <div className={'hidden md:grid ' + GRID + ' h-[64px]'}>
        {/* Date */}
        <button type="button" onClick={onOpen} className="text-left">
          <div className="text-[13px] text-text-primary dark:text-[#F5F7FF] tnum font-medium">
            {format(row.date, 'dd MMM')}
          </div>
          <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] tnum">
            {row.date.getFullYear()}
          </div>
        </button>

        {/* Title + description */}
        <button type="button" onClick={onOpen} className="text-left flex items-center gap-3 min-w-0 pr-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: row.categoryColourHex + '1F', color: row.categoryColourHex }}
            aria-hidden="true"
          >
            <Icon size={16} style={{ color: row.categoryColourHex }} />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">
              {row.title}
            </div>
            {row.description && (
              <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate">{row.description}</div>
            )}
          </div>
        </button>

        {/* Category */}
        <div>
          <CategoryChip name={row.categoryName} color={row.categoryColourHex} />
        </div>

        {/* Amount */}
        <div className="text-right text-[14px] font-semibold text-text-primary dark:text-[#F5F7FF] tnum">
          {formatCurrency(row.amount)}
        </div>

        {/* Actions — hover-only opacity (no hover on mobile, so the mobile branch keeps them visible). */}
        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
          {editBtn}
          {deleteBtn}
          {viewBtn}
        </div>
      </div>

      {/* ── Mobile < md: stacked layout ───────────────────────────── */}
      <button
        type="button"
        onClick={onOpen}
        className="md:hidden w-full text-left flex items-start gap-3 px-4 py-3"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: row.categoryColourHex + '1F', color: row.categoryColourHex }}
          aria-hidden="true"
        >
          <Icon size={16} style={{ color: row.categoryColourHex }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">
              {row.title}
            </div>
            <div className="text-[14px] font-semibold text-text-primary dark:text-[#F5F7FF] tnum whitespace-nowrap shrink-0">
              {formatCurrency(row.amount)}
            </div>
          </div>
          {row.description && (
            <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate mt-0.5">{row.description}</div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <CategoryChip name={row.categoryName} color={row.categoryColourHex} />
            <span className="text-[11px] text-text-muted dark:text-[#94A3B8]">·</span>
            <span className="text-[11.5px] text-text-muted dark:text-[#94A3B8] tnum">
              {format(row.date, 'dd MMM yyyy')}
            </span>
          </div>
        </div>
        {/* Stop click propagation so action taps don't also trigger row "view". */}
        <div className="flex flex-col items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {editBtn}
          {deleteBtn}
        </div>
      </button>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="border-t border-border dark:border-[#1F2A44] first:border-t-0">
      {/* md+: 5-column skeleton */}
      <div className={'hidden md:grid ' + GRID + ' h-[64px]'}>
        <Skeleton className="h-8 w-20" />
        <div className="flex items-center gap-3"><Skeleton className="w-9 h-9 rounded-lg" /><Skeleton className="h-4 w-44" /></div>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      {/* <md: stacked skeleton */}
      <div className="md:hidden flex items-start gap-3 px-4 py-3">
        <Skeleton className="w-9 h-9 rounded-lg shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-40 mt-2" />
        </div>
      </div>
    </div>
  );
}

function EmptyRows() {
  return (
    <div className="p-12 flex flex-col items-center text-center fade-up">
      <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-3" aria-hidden="true">
        <Search size={20} />
      </div>
      <div className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">No expenses match your filters</div>
      <p className="text-[12.5px] text-text-muted dark:text-[#94A3B8] mt-1 max-w-sm">
        Try adjusting your search, or clear filters to see all expenses.
      </p>
    </div>
  );
}

interface ExpensesTableV2Props {
  rows: EnrichedExpense[];
  sort: SortState;
  onSortChange: (next: SortState) => void;
  isLoading: boolean;
  canEdit: boolean;
  onOpen: (row: EnrichedExpense) => void;
  onEdit: (row: EnrichedExpense) => void;
  onDelete: (row: EnrichedExpense) => void;
}

export function ExpensesTableV2({
  rows,
  sort,
  onSortChange,
  isLoading,
  canEdit,
  onOpen,
  onEdit,
  onDelete,
}: ExpensesTableV2Props) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card overflow-hidden">
      {/* Header — desktop-only; mobile rows are self-describing. Mobile gets
          a compact "sort by" pill row instead so users can still re-sort. */}
      <div className={'hidden md:grid ' + GRID + ' h-11 border-b border-border dark:border-[#1F2A44] bg-surface-muted/60 dark:bg-[#081028]/40'}>
        <SortHeader label="Date"     sortKey="date"   sort={sort} onSortChange={onSortChange} />
        <SortHeader label="Title"    sortKey="title"  sort={sort} onSortChange={onSortChange} />
        <SortHeader label="Category" sortKey="cat"    sort={sort} onSortChange={onSortChange} />
        <SortHeader label="Amount"   sortKey="amount" sort={sort} onSortChange={onSortChange} align="right" />
        <div className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] text-right pr-1">
          Actions
        </div>
      </div>
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border dark:border-[#1F2A44] bg-surface-muted/60 dark:bg-[#081028]/40 overflow-x-auto">
        <span className="text-[10.5px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8] shrink-0">
          Sort
        </span>
        <SortHeader label="Date"     sortKey="date"   sort={sort} onSortChange={onSortChange} />
        <SortHeader label="Title"    sortKey="title"  sort={sort} onSortChange={onSortChange} />
        <SortHeader label="Category" sortKey="cat"    sort={sort} onSortChange={onSortChange} />
        <SortHeader label="Amount"   sortKey="amount" sort={sort} onSortChange={onSortChange} />
      </div>

      {/* Body */}
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => <LoadingRow key={i} />)
      ) : rows.length === 0 ? (
        <EmptyRows />
      ) : (
        rows.map((r) => (
          <ExpenseRow
            key={r.id}
            row={r}
            canEdit={canEdit}
            onOpen={() => onOpen(r)}
            onEdit={() => onEdit(r)}
            onDelete={() => onDelete(r)}
          />
        ))
      )}
    </div>
  );
}
