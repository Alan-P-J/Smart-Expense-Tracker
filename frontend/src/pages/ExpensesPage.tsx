import { useEffect, useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ChevronDown, ChevronLeft, ChevronRight, Download, FileText, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { ExpenseStats } from '../components/expenses/ExpenseStats';
import { ExpenseFilterBar } from '../components/expenses/ExpenseFilterBar';
import { ActiveFilterChips } from '../components/expenses/ActiveFilterChips';
import { ExpensesTableV2 } from '../components/expenses/ExpensesTableV2';
import type { SortState } from '../components/expenses/ExpensesTableV2';
import { ExpenseDetailDrawer } from '../components/expenses/ExpenseDetailDrawer';
import { enrichExpense, type EnrichedExpense } from '../components/expenses/enrichExpense';
import type { ExpenseFiltersState } from '../components/expenses/ExpenseFilterBar';
import { expenseService } from '../api/services/expenseService';
import { categoryService } from '../api/services/categoryService';
import { exportService } from '../api/services/exportService';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { ExpenseResponse } from '../types';

const DEFAULT_FILTERS: ExpenseFiltersState = {
  search: '',
  categoryId: null,
  status: 'All',
  from: '',
  to: '',
};

const SECONDARY_BUTTON =
  'h-10 px-3.5 rounded-lg border border-border dark:border-[#2D3956] ' +
  'bg-white dark:bg-[#1A233A] ' +
  'text-text-muted dark:text-[#94A3B8] ' +
  'hover:text-text-primary dark:hover:text-[#F5F7FF] ' +
  'transition inline-flex items-center gap-2 text-[13px] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const PAGE_SIZES = [10, 20, 50, 100];

export function ExpensesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // ── filter state (local; v4 layout uses URL-less state) ──
  const [filters, setFilters] = useState<ExpenseFiltersState>(DEFAULT_FILTERS);
  const setFilter = <K extends keyof ExpenseFiltersState>(key: K, value: ExpenseFiltersState[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };
  const clearFilters = () => setFilters(DEFAULT_FILTERS);
  // Debounce search so we don't refetch on every keystroke.
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  // ── sort + pagination ──
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [filters.categoryId, filters.status, filters.from, filters.to, debouncedSearch, sort, pageSize]);

  // ── modals ──
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseResponse | null>(null);
  const [deleting, setDeleting] = useState<EnrichedExpense | null>(null);
  const [drawerRow, setDrawerRow] = useState<EnrichedExpense | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  // Two URL handoffs from the topbar:
  //   ?new=1            — open the Add Expense form (admin only)
  //   ?search=<term>    — seed the search filter (header search)
  // Both params are consumed once then stripped from the URL.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    let mutated = false;
    if (searchParams.get('new') === '1' && isAdmin) {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete('new');
      mutated = true;
    }
    const term = searchParams.get('search');
    if (term) {
      setFilters((f) => ({ ...f, search: term }));
      searchParams.delete('search');
      mutated = true;
    }
    if (mutated) {
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isAdmin]);

  // ── data fetch ──
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    staleTime: Infinity,
  });

  const { data: expensesPage, isLoading, isError, refetch } = useQuery({
    queryKey: ['expenses', 'v2', {
      search: debouncedSearch,
      categoryId: filters.categoryId,
      from: filters.from,
      to: filters.to,
    }],
    queryFn: () =>
      expenseService.getExpenses({
        search: debouncedSearch || undefined,
        categoryId: filters.categoryId ?? undefined,
        startDate: filters.from || undefined,
        endDate: filters.to || undefined,
        page: 0,
        size: 100,
      }),
    placeholderData: keepPreviousData,
  });

  const rawAll = expensesPage?.content ?? [];

  // Enrich → status filter → sort
  const enriched: EnrichedExpense[] = useMemo(() => rawAll.map(enrichExpense), [rawAll]);

  const filtered: EnrichedExpense[] = useMemo(() => {
    const out = filters.status === 'All' ? enriched : enriched.filter((r) => r.status === filters.status);
    const dir = sort.dir === 'desc' ? -1 : 1;
    const getKey = (r: EnrichedExpense): number | string => {
      switch (sort.key) {
        case 'date':   return r.date.getTime();
        case 'amount': return r.amount;
        case 'title':  return r.title.toLowerCase();
        case 'cat':    return r.categoryName.toLowerCase();
        default:       return 0;
      }
    };
    return [...out].sort((a, b) => {
      const A = getKey(a);
      const B = getKey(b);
      if (A < B) return -1 * dir;
      if (A > B) return  1 * dir;
      return 0;
    });
  }, [enriched, filters.status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, filtered.length);

  // ── mutations ──
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expenseService.deleteExpense(id),
    onSuccess: () => {
      toast.success(`Deleted "${deleting?.title}"`);
      setDeleting(null);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = err instanceof AxiosError ? err.response?.data?.message ?? err.message : 'Delete failed';
      toast.error(msg);
    },
  });

  // ── handlers ──
  const handleExport = async (kind: 'csv' | 'pdf') => {
    if (exporting) return;
    setExporting(kind);
    try {
      await (kind === 'csv' ? exportService.downloadCsv() : exportService.downloadPdf());
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 403) {
        toast.error("You don't have permission to export this report");
      } else {
        toast.error(`Couldn't download ${kind.toUpperCase()}. Try again.`);
      }
    } finally {
      setExporting(null);
    }
  };

  const handleEditFromRow = (row: EnrichedExpense) => {
    const raw = rawAll.find((r: ExpenseResponse) => r.id === row.id);
    if (raw) {
      setEditing(raw);
      setFormOpen(true);
    }
  };

  const handleEditFromDrawer = (row: EnrichedExpense) => {
    setDrawerRow(null);
    handleEditFromRow(row);
  };

  // ── derived header counts ──
  const totalCount = enriched.length;
  const pendingCount = enriched.filter((r) => r.status === 'Pending').length;

  // Smart page-button list with ellipses (matches v4 design).
  const pageButtons: (number | 'ellipsis')[] = useMemo(() => {
    const out: (number | 'ellipsis')[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - safePage) <= 1) out.push(i);
      else if (out[out.length - 1] !== 'ellipsis') out.push('ellipsis');
    }
    return out;
  }, [totalPages, safePage]);

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
            Expenses
          </h1>
          <p className="text-[13px] sm:text-[13.5px] text-text-muted dark:text-[#94A3B8] mt-1 tnum">
            {totalCount} total {totalCount === 1 ? 'expense' : 'expenses'} · {pendingCount} pending approval
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={exporting != null}
            className={SECONDARY_BUTTON}
          >
            <Download size={15} aria-hidden="true" />
            {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting != null}
              className={SECONDARY_BUTTON}
            >
              <FileText size={15} aria-hidden="true" />
              {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="h-10 px-4 rounded-lg text-white text-[13px] font-semibold inline-flex items-center gap-2 transition active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
              style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
            >
              <Plus size={15} aria-hidden="true" />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <ExpenseStats rows={filtered} allRows={enriched} isLoading={isLoading} />

      {/* Filter bar */}
      <ExpenseFilterBar
        filters={filters}
        categories={categories ?? []}
        onChange={setFilter}
      />

      {/* Active filter chips + count */}
      <ActiveFilterChips
        filters={filters}
        categories={categories ?? []}
        count={filtered.length}
        total={totalCount}
        onChange={setFilter}
        onClear={clearFilters}
      />

      {/* Table or error fallback */}
      {isError ? (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] p-10 shadow-card flex flex-col items-center text-center">
          <p className="font-semibold text-text-primary dark:text-[#F5F7FF]">Couldn't load expenses</p>
          <p className="text-[13.5px] text-text-muted dark:text-[#94A3B8] mt-1">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 px-5 h-10 rounded-xl text-[13px] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(91,92,240,0.7)]"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            Retry
          </button>
        </div>
      ) : (
        <ExpensesTableV2
          rows={pageRows}
          sort={sort}
          onSortChange={setSort}
          isLoading={isLoading}
          canEdit={isAdmin}
          onOpen={setDrawerRow}
          onEdit={handleEditFromRow}
          onDelete={setDeleting}
        />
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8]">
          Showing <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{start}</span>–
          <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{end}</span> of{' '}
          <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-[12.5px] text-text-muted dark:text-[#94A3B8]">
            Rows per page
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="appearance-none h-8 rounded-md bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#2D3956] px-2.5 pr-7 text-[12.5px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none cursor-pointer"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none" aria-hidden="true" />
            </div>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              className="w-8 h-8 rounded-md border border-border dark:border-[#2D3956] bg-white dark:bg-[#1A233A] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center"
            >
              <ChevronLeft size={13} aria-hidden="true" />
            </button>
            {pageButtons.map((p, i) =>
              p === 'ellipsis' ? (
                <span key={'e' + i} className="px-1.5 text-text-muted dark:text-[#94A3B8] text-[12px]">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === safePage ? 'page' : undefined}
                  className={
                    'min-w-8 h-8 px-2 rounded-md text-[12.5px] font-semibold tnum transition ' +
                    (p === safePage
                      ? 'bg-accent text-white'
                      : 'bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF]')
                  }
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
              className="w-8 h-8 rounded-md border border-border dark:border-[#2D3956] bg-white dark:bg-[#1A233A] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center"
            >
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-2" />

      {/* Detail drawer */}
      <ExpenseDetailDrawer
        row={drawerRow}
        canEdit={isAdmin}
        onClose={() => setDrawerRow(null)}
        onEdit={handleEditFromDrawer}
        onDelete={(r) => setDeleting(r)}
      />

      {/* Add / Edit modal — reuses Day-8 ExpenseForm */}
      <ExpenseForm
        isOpen={formOpen}
        initialData={editing}
        categories={categories ?? []}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSuccess={() => { setFormOpen(false); setEditing(null); invalidate(); }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleting != null}
        title="Delete this expense?"
        message={deleting ? `"${deleting.title}" will be permanently removed.` : ''}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id); }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
