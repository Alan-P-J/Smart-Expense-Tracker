import { useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, Download, FileText, Plus } from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { AppCard } from '../components/ui/AppCard';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Pagination } from '../components/ui/Pagination';

import { ExpenseFilters } from '../components/expenses/ExpenseFilters';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { ExpenseForm } from '../components/expenses/ExpenseForm';

import { expenseService } from '../api/services/expenseService';
import { categoryService } from '../api/services/categoryService';
import { exportService } from '../api/services/exportService';
import { useAuth } from '../hooks/useAuth';
import { useExpenseFilters } from '../hooks/useExpenseFilters';
import type { ExpenseResponse } from '../types';

const EXPORT_BTN =
  'flex items-center gap-2 text-sm ' +
  'border border-border-strong dark:border-border-dark-strong ' +
  'text-text-secondary dark:text-text-dark-secondary ' +
  'px-3 py-2 rounded-lg ' +
  'hover:bg-surface-muted dark:hover:bg-border-dark ' +
  'transition-colors duration-150 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function ExpensesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const {
    filters,
    searchInput,
    setSearch,
    setCategoryId,
    setStartDate,
    setEndDate,
    setPage,
    resetFilters,
    hasActiveFilters,
  } = useExpenseFilters();

  const [isFormOpen,        setFormOpen]        = useState(false);
  const [editingExpense,    setEditingExpense]  = useState<ExpenseResponse | null>(null);
  const [deletingExpense,   setDeletingExpense] = useState<ExpenseResponse | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  // CSV/PDF downloads — wrap exportService so we can show toast feedback
  // on 401/403/network. Using axios+blob (rather than window.open) lets us
  // catch HTTP errors and avoid leaving the user with a popped-up tab.
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

  // Categories — rarely change after seed; cache forever.
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    staleTime: Infinity,
  });

  // Expenses — placeholderData keeps the previous page on screen while
  // the next page loads. Smoother than the default "blank then data" flash.
  // Map null → undefined because the service's ExpenseListParams uses optional
  // props (skips them on the wire); null would otherwise serialise as ?key=null.
  // `isLoading` is only true on the *first* fetch with no cached data.
  // `isFetching` is true for any in-flight request, including background
  // refetches when filters change while we already have data — used to
  // show a subtle "refreshing" indicator without re-flashing the table.
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () =>
      expenseService.getExpenses({
        search:     filters.search || undefined,
        categoryId: filters.categoryId ?? undefined,
        startDate:  filters.startDate ?? undefined,
        endDate:    filters.endDate ?? undefined,
        page:       filters.page,
        size:       filters.size,
      }),
    placeholderData: keepPreviousData,
  });

  const isRefetching = isFetching && !isLoading;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expenseService.deleteExpense(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeletingExpense(null);
    },
    onError: (err) => {
      if (err instanceof AxiosError && err.response?.status === 403) {
        toast.error("You don't have permission");
      } else {
        toast.error('Failed to delete expense');
      }
    },
  });

  const handleEdit = (expense: ExpenseResponse) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingExpense(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
  };

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${data?.totalElements ?? 0} total expenses`}
        action={
          isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setFormOpen(true);
              }}
              className={
                'flex items-center gap-2 bg-primary hover:bg-primary-hover text-white ' +
                'px-4 py-2 rounded-lg text-sm font-medium ' +
                'transition-all duration-200 active:scale-[0.98] ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              }
            >
              <Plus size={16} aria-hidden="true" />
              Add expense
            </button>
          )
        }
      />

      {/* Export row — CSV is open to viewers, PDF is admin-only.
          Sits between the header and the main card so it doesn't compete
          for visual weight with the data table. */}
      <div className="flex justify-end gap-2 -mt-2 mb-2">
        <button
          type="button"
          onClick={() => handleExport('csv')}
          disabled={exporting !== null}
          className={EXPORT_BTN}
          aria-label="Export CSV"
        >
          <Download size={15} aria-hidden="true" />
          {exporting === 'csv' ? 'Preparing…' : 'Export CSV'}
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className={EXPORT_BTN}
            aria-label="Export PDF"
          >
            <FileText size={15} aria-hidden="true" />
            {exporting === 'pdf' ? 'Preparing…' : 'Export PDF'}
          </button>
        )}
      </div>

      <AppCard className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ExpenseFilters
              categories={categories ?? []}
              searchInput={searchInput}
              filters={{
                categoryId: filters.categoryId,
                startDate: filters.startDate,
                endDate: filters.endDate,
              }}
              setSearch={setSearch}
              setCategoryId={setCategoryId}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={resetFilters}
            />
          </div>
          {/* Background-refetch indicator: shows only when a query is
              in flight AFTER we already had data on screen. Avoids the
              full-table skeleton flash when filters change. */}
          {isRefetching && (
            <div
              className="flex items-center gap-2 text-xs text-text-muted dark:text-text-dark-muted"
              role="status"
              aria-live="polite"
            >
              <LoadingSpinner size="sm" />
              <span>Refreshing…</span>
            </div>
          )}
        </div>

        {/* Error state with retry — never leave the table broken. */}
        {isError && !isLoading ? (
          <div className="flex flex-col items-center text-center py-12">
            <AlertTriangle size={24} className="text-danger" aria-hidden="true" />
            <p className="mt-3 font-medium text-text-primary dark:text-text-dark-primary">
              Couldn't load expenses
            </p>
            <p className="text-sm text-text-muted dark:text-text-dark-muted mt-1">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className={
                'mt-4 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium ' +
                'hover:bg-primary hover:text-white ' +
                'active:scale-[0.98] transition-all duration-200 ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              }
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/*
              ARCHITECTURE NOTE — Large dataset readiness:
              Current page size is capped at 100 server-side and 20 by default,
              so DOM-row count is bounded. If page size grows or "infinite scroll"
              lands, swap ExpenseTable's plain map() for one of:
                - react-window / @tanstack/react-virtual for virtualised rows
                - useInfiniteQuery with intersection observer for infinite scroll
              Either changeover lives entirely in ExpenseTable; this page can
              keep its current orchestration shape.
            */}
            <ExpenseTable
              expenses={data?.content ?? []}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={(exp) => setDeletingExpense(exp)}
              isAdmin={isAdmin}
              hasFilters={hasActiveFilters}
            />

            {data && data.totalPages > 1 && (
              <Pagination
                currentPage={filters.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                pageSize={filters.size}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </AppCard>

      <ExpenseForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        initialData={editingExpense}
        categories={categories ?? []}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        isOpen={!!deletingExpense}
        title="Delete expense"
        message={`Delete "${deletingExpense?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deletingExpense && deleteMutation.mutate(deletingExpense.id)}
        onCancel={() => setDeletingExpense(null)}
      />
    </>
  );
}
