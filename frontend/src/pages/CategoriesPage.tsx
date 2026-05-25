import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ChevronDown, Grid, List, Plus, Search, Tag } from 'lucide-react';

import { AppCard } from '../components/ui/AppCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CategoryForm } from '../components/categories/CategoryForm';
import { CategoryCard, type CategoryView } from '../components/categories/CategoryCard';
import { CategoryListRow, CATEGORY_LIST_COLS } from '../components/categories/CategoryListRow';
import { CategoryDrawer } from '../components/categories/CategoryDrawer';
import { CategoriesStats } from '../components/categories/CategoriesStats';
import { seriesFor } from '../components/ui/Sparkline';

import { categoryService } from '../api/services/categoryService';
import { budgetService } from '../api/services/budgetService';
import { dashboardService } from '../api/services/dashboardService';
import { useAuth } from '../hooks/useAuth';
import type { CategoryResponse } from '../types';

const GRID = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5';

type View = 'grid' | 'list';
type TypeFilter = 'All' | 'Default' | 'Custom';
type SortKey = 'spend-desc' | 'spend-asc' | 'name' | 'count';

const TYPE_FILTERS: TypeFilter[] = ['All', 'Default', 'Custom'];

export function CategoriesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);
  const [drawerView, setDrawerView] = useState<CategoryView | null>(null);

  const [view, setViewMode] = useState<View>('grid');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('spend-desc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');

  // Open form when navigated here from the topbar quick-add (?new=1).
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === '1' && isAdmin) {
      setEditingCategory(null);
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isAdmin]);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    staleTime: Infinity,
  });

  const { data: byCategory } = useQuery({
    queryKey: ['dashboard', 'by-category'],
    queryFn: () => dashboardService.getByCategory(),
  });

  const { data: budgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getBudgets,
  });

  // Build a view-model per category: merge spent (from dashboard) + budget (from budgets).
  // Trend & delta are visual mocks — the backend doesn't track per-category weekly spend yet.
  const views: CategoryView[] = useMemo(() => {
    if (!categories) return [];
    const spentByCat = new Map<number, number>();
    (byCategory ?? []).forEach((c) => spentByCat.set(c.categoryId, Number(c.total) || 0));
    const budgetByCat = new Map<number, number>();
    (budgets ?? []).forEach((b) => budgetByCat.set(b.categoryId, Number(b.monthlyLimit) || 0));

    return categories.map((cat) => {
      const spent = spentByCat.get(cat.id) ?? 0;
      const budget = budgetByCat.get(cat.id) ?? 0;
      // Deterministic visual delta from the id so it stays stable across renders.
      const seed = (cat.id * 13) % 60;
      const delta = spent > 0 ? Number((seed - 30).toFixed(1)) / 2 : 0;
      const trend = seriesFor(Math.max(spent / 7, 50), 0.2, 7);
      return {
        category: cat,
        spent,
        budget,
        count: 0,
        delta,
        trend,
        lastUsed: spent > 0 ? 'this month' : null,
      };
    });
  }, [categories, byCategory, budgets]);

  const stats = useMemo(() => {
    const list = views;
    const defaultCount = list.filter((v) => v.category.isDefault).length;
    const customCount = list.length - defaultCount;
    const totalSpent = list.reduce((s, v) => s + v.spent, 0);
    const totalBudget = list.reduce((s, v) => s + v.budget, 0);
    const overBudgetCount = list.filter((v) => v.budget > 0 && v.spent > v.budget).length;
    const top = [...list].sort((a, b) => b.spent - a.spent)[0];
    return {
      total: list.length,
      defaultCount,
      customCount,
      totalSpent,
      totalBudget,
      overBudgetCount,
      topName: top && top.spent > 0 ? top.category.name : null,
      topAmount: top ? top.spent : 0,
    };
  }, [views]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = views.filter((v) => {
      if (q && !v.category.name.toLowerCase().includes(q)) return false;
      if (typeFilter === 'Default' && !v.category.isDefault) return false;
      if (typeFilter === 'Custom' && v.category.isDefault) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sort === 'spend-desc') return b.spent - a.spent;
      if (sort === 'spend-asc') return a.spent - b.spent;
      if (sort === 'name') return a.category.name.localeCompare(b.category.name);
      if (sort === 'count') return b.count - a.count;
      return 0;
    });
    return out;
  }, [views, search, sort, typeFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeletingCategory(null);
    },
    onError: (err) => {
      if (err instanceof AxiosError && err.response?.status === 409) {
        toast.error(
          'Cannot delete — expenses exist in this category. Reassign or delete those expenses first.',
        );
      } else if (err instanceof AxiosError && err.response?.status === 403) {
        toast.error("You don't have permission");
      } else {
        toast.error('Failed to delete category');
      }
      setDeletingCategory(null);
    },
  });

  const handleAdd = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (cat: CategoryResponse) => {
    setEditingCategory(cat);
    setFormOpen(true);
    setDrawerView(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
            Categories
          </h1>
          <p className="text-[12.5px] sm:text-[13px] text-text-muted dark:text-[#94A3B8] mt-1 tnum">
            {categories ? `${categories.length} categories` : 'Loading…'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={handleAdd}
            className="h-10 px-3.5 sm:px-4 rounded-lg text-white text-[12.5px] sm:text-[13px] font-semibold inline-flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto transition active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
            style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
          >
            <Plus size={15} aria-hidden="true" /> Add Category
          </button>
        )}
      </div>

      {!isLoading && categories && categories.length > 0 && (
        <CategoriesStats
          total={stats.total}
          defaultCount={stats.defaultCount}
          customCount={stats.customCount}
          totalSpent={stats.totalSpent}
          totalBudget={stats.totalBudget}
          topCategoryName={stats.topName}
          topCategoryAmount={stats.topAmount}
          overBudgetCount={stats.overBudgetCount}
        />
      )}

      {/* Toolbar */}
      {!isLoading && categories && categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-[160px] sm:max-w-[420px] relative order-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              aria-label="Search categories"
              className="w-full h-10 rounded-lg bg-white dark:bg-[#1A233A] border border-border-strong dark:border-[#2D3956] pl-9 pr-3 text-[13px] text-text-primary dark:text-[#F5F7FF] placeholder:text-text-muted dark:placeholder:text-[#94A3B8] focus:border-accent/60 transition"
            />
          </div>

          <div className="flex h-10 rounded-lg bg-white dark:bg-[#1A233A] border border-border-strong dark:border-[#2D3956] p-0.5 order-2 sm:order-4 sm:ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={view === 'grid'}
              aria-label="Grid view"
              className={
                'w-9 rounded-md flex items-center justify-center transition ' +
                (view === 'grid'
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF]')
              }
            >
              <Grid size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={view === 'list'}
              aria-label="List view"
              className={
                'w-9 rounded-md flex items-center justify-center transition ' +
                (view === 'list'
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF]')
              }
            >
              <List size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="flex h-10 rounded-lg bg-white dark:bg-[#1A233A] border border-border-strong dark:border-[#2D3956] p-0.5 order-3">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={
                  'px-2.5 sm:px-3.5 rounded-md text-[12px] sm:text-[12.5px] font-semibold transition ' +
                  (typeFilter === t
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF]')
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative order-4 sm:order-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort categories"
              className="appearance-none h-10 rounded-lg bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#2D3956] pl-3 pr-8 text-[12.5px] sm:text-[13px] text-text-primary dark:text-[#F5F7FF] focus:border-accent/60 focus:outline-none transition cursor-pointer"
            >
              <option value="spend-desc">Highest spend</option>
              <option value="spend-asc">Lowest spend</option>
              <option value="name">Name (A–Z)</option>
              <option value="count">Most txns</option>
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8] pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {!isLoading && categories && categories.length > 0 && (
        <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8]">
          Showing <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{filtered.length}</span> of{' '}
          <span className="text-text-primary dark:text-[#F5F7FF] font-semibold tnum">{categories.length}</span> categories
        </div>
      )}

      {/* Body */}
      {isLoading && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <AppCard key={i} className="space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </AppCard>
          ))}
        </div>
      )}

      {!isLoading && categories && categories.length === 0 && (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Add a category to organise expenses"
          actionLabel={isAdmin ? 'Add category' : undefined}
          onAction={isAdmin ? handleAdd : undefined}
        />
      )}

      {!isLoading && categories && categories.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-3">
            <Search size={20} aria-hidden="true" />
          </div>
          <div className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">No categories match</div>
          <p className="text-[12.5px] text-text-muted dark:text-[#94A3B8] mt-1 max-w-sm">
            Try a different search or clear filters.
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && view === 'grid' && (
        <div className={GRID}>
          {filtered.map((v) => (
            <CategoryCard
              key={v.category.id}
              view={v}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={setDeletingCategory}
              onSelect={setDrawerView}
              selected={drawerView?.category.id === v.category.id}
            />
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 && view === 'list' && (
        <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[940px]">
              <div
                className={
                  CATEGORY_LIST_COLS +
                  ' items-center px-4 h-10 border-b border-border dark:border-[#1F2A44] bg-surface-muted/40 dark:bg-[#121B32]/40 ' +
                  'text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]'
                }
              >
                <div>Name</div>
                <div>Transactions</div>
                <div>Spent</div>
                <div>Budget</div>
                <div>Δ MoM</div>
                <div>Last used</div>
                <div className="text-right">Actions</div>
              </div>
              {filtered.map((v) => (
                <CategoryListRow
                  key={v.category.id}
                  view={v}
                  isAdmin={isAdmin}
                  onEdit={handleEdit}
                  onDelete={setDeletingCategory}
                  onSelect={setDrawerView}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="h-2" />

      <CategoryDrawer
        view={drawerView}
        isAdmin={isAdmin}
        onClose={() => setDrawerView(null)}
        onEdit={handleEdit}
      />

      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        initialData={editingCategory}
        onSuccess={handleFormClose}
      />

      <ConfirmDialog
        isOpen={!!deletingCategory}
        title="Delete category"
        message={`Delete "${deletingCategory?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
