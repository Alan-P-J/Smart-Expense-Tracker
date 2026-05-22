import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';

import { PageHeader } from '../components/ui/PageHeader';
import { AppCard } from '../components/ui/AppCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CategoryForm } from '../components/categories/CategoryForm';

import { categoryService } from '../api/services/categoryService';
import { getCategoryIcon } from '../utils/categoryIconMap';
import { useAuth } from '../hooks/useAuth';
import type { CategoryResponse } from '../types';

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

const ICON_BTN =
  'p-1.5 rounded-lg text-text-muted dark:text-text-dark-muted ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function CategoriesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    staleTime: Infinity,
  });

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

  const handleEdit = (cat: CategoryResponse) => {
    setEditingCategory(cat);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingCategory(null);
  };

  const handleFormSuccess = () => handleFormClose();

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle={categories ? `${categories.length} categories` : 'Loading…'}
        action={
          isAdmin && (
            <button
              type="button"
              onClick={handleAdd}
              className={
                'flex items-center gap-2 bg-primary hover:bg-primary-hover text-white ' +
                'px-4 py-2 rounded-lg text-sm font-medium ' +
                'transition-all duration-200 active:scale-[0.98] ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              }
            >
              <Plus size={16} aria-hidden="true" />
              Add category
            </button>
          )
        }
      />

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

      {!isLoading && categories && categories.length > 0 && (
        <div className={GRID}>
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.iconName);
            return (
              <AppCard key={cat.id}>
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cat.colourHex }}
                    aria-hidden="true"
                  >
                    <Icon size={18} color="white" />
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        aria-label={`Edit ${cat.name}`}
                        className={`${ICON_BTN} hover:text-primary hover:bg-primary-light`}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => !cat.isDefault && setDeletingCategory(cat)}
                        disabled={cat.isDefault}
                        aria-label={`Delete ${cat.name}`}
                        title={cat.isDefault ? 'Default categories cannot be deleted' : undefined}
                        className={
                          `${ICON_BTN} ` +
                          (cat.isDefault
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:text-danger hover:bg-danger/10')
                        }
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-base font-semibold text-text-primary dark:text-text-dark-primary mt-3 truncate">
                  {cat.name}
                </p>
                {cat.isDefault ? (
                  <span className="inline-block text-xs bg-surface-muted dark:bg-border-dark text-text-muted dark:text-text-dark-muted px-2 py-0.5 rounded-full mt-1">
                    Default
                  </span>
                ) : (
                  <span className="inline-block text-xs text-text-muted dark:text-text-dark-muted mt-1 font-mono">
                    {cat.colourHex.toUpperCase()}
                  </span>
                )}
              </AppCard>
            );
          })}
        </div>
      )}

      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        initialData={editingCategory}
        onSuccess={handleFormSuccess}
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
    </>
  );
}
