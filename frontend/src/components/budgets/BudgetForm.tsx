import { useEffect, useId, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { X } from 'lucide-react';

import { FormInput } from '../ui/FormInput';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { budgetService } from '../../api/services/budgetService';
import type { BudgetRequest, BudgetResponse, CategoryResponse } from '../../types';

// Amount stays a string — same float-precision concern as ExpenseForm.
const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

const budgetSchema = z.object({
  categoryId: z.number({ error: 'Select a category' }).positive('Select a category'),
  monthlyLimit: z
    .string()
    .min(1, 'Limit is required')
    .regex(AMOUNT_REGEX, 'Enter a valid amount (up to 2 decimal places)')
    .refine((v) => Number.parseFloat(v) > 0, 'Limit must be greater than 0'),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: BudgetResponse | null;
  categories: CategoryResponse[];
  /** Categories that already have a budget — hidden from the add dropdown
   *  so users can't double-budget (server upserts, but UX shouldn't suggest
   *  "add" when it would actually be "edit"). */
  budgetedCategoryIds: Set<number>;
  onSuccess: () => void;
}

const SELECT_FIELD =
  'w-full px-3 py-2.5 rounded-lg border ' +
  'border-border-strong dark:border-[#2D3956] ' +
  'bg-surface dark:bg-[#1A233A] ' +
  'text-text-primary dark:text-[#F5F7FF] ' +
  'focus:outline-none focus:ring-2 focus:ring-primary ' +
  'transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed';

const LABEL =
  'block text-sm font-medium text-text-secondary dark:text-[#CBD5E1] mb-1';

const CANCEL_BTN =
  'px-4 py-2 rounded-lg border border-border-strong dark:border-[#2D3956] ' +
  'text-text-secondary dark:text-[#CBD5E1] text-sm font-medium ' +
  'hover:bg-surface-muted dark:hover:bg-border-dark ' +
  'transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const SUBMIT_BTN =
  'px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium ' +
  'active:scale-[0.98] transition-all duration-200 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'flex items-center gap-2 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function BudgetForm({
  isOpen,
  onClose,
  initialData,
  categories,
  budgetedCategoryIds,
  onSuccess,
}: BudgetFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { categoryId: 0, monthlyLimit: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      reset({
        categoryId: initialData.categoryId,
        monthlyLimit: String(initialData.monthlyLimit),
      });
    } else {
      reset({ categoryId: 0, monthlyLimit: '' });
    }
  }, [isOpen, initialData, reset]);

  // ADD mode shows EVERY category but disables the ones that already have a
  // budget — keeps the user oriented (no silently vanishing options) while
  // still preventing duplicate budgets (the (category_id, company_id) UNIQUE
  // would reject it server-side anyway). EDIT pins the current category.
  const selectableCategories = useMemo(() => {
    if (isEditMode && initialData) {
      const current = categories.find((c) => c.id === initialData.categoryId);
      return current ? [current] : [];
    }
    return categories;
  }, [categories, isEditMode, initialData]);

  // True when every visible category is already budgeted — the form is then
  // effectively read-only in ADD mode; show the hint below.
  const allCategoriesBudgeted = useMemo(
    () => !isEditMode && categories.length > 0 && categories.every((c) => budgetedCategoryIds.has(c.id)),
    [categories, budgetedCategoryIds, isEditMode],
  );

  const mutation = useMutation({
    mutationFn: (values: BudgetFormValues) => {
      const payload: BudgetRequest = {
        categoryId: values.categoryId,
        monthlyLimit: values.monthlyLimit,
      };
      return budgetService.upsertBudget(payload);
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Budget updated' : 'Budget set');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 403) toast.error("You don't have permission");
        else if (status === 400) toast.error(err.response?.data?.message ?? 'Validation failed');
        else toast.error('Something went wrong');
      } else {
        toast.error('Something went wrong');
      }
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      modalRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusables = Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={
          'bg-surface dark:bg-[#1A233A] ' +
          'rounded-2xl border border-border dark:border-[#1F2A44] ' +
          'w-full max-w-lg shadow-xl ' +
          'max-h-[90vh] overflow-y-auto'
        }
      >
        <div className="flex justify-between items-center p-6 pb-0">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary dark:text-[#F5F7FF]">
            {isEditMode ? 'Edit budget' : 'Set budget'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={
              'p-2 rounded-lg text-text-muted dark:text-[#94A3B8] ' +
              'hover:bg-surface-muted dark:hover:bg-border-dark ' +
              'transition-colors duration-200 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            }
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="p-6 space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="budget-category" className={LABEL}>
              Category
            </label>
            <select
              id="budget-category"
              className={SELECT_FIELD}
              disabled={isEditMode}
              aria-invalid={!!errors.categoryId}
              {...register('categoryId', { valueAsNumber: true })}
            >
              {!isEditMode && <option value={0}>Select a category…</option>}
              {selectableCategories.map((c) => {
                const alreadyBudgeted = !isEditMode && budgetedCategoryIds.has(c.id);
                return (
                  <option key={c.id} value={c.id} disabled={alreadyBudgeted}>
                    {c.name}{alreadyBudgeted ? ' (already budgeted)' : ''}
                  </option>
                );
              })}
            </select>
            {allCategoriesBudgeted && (
              <p className="text-xs text-text-muted dark:text-[#94A3B8] mt-1">
                Every category already has a budget — edit one instead.
              </p>
            )}
            {errors.categoryId && (
              <p className="text-sm text-danger mt-1">{errors.categoryId.message}</p>
            )}
          </div>

          <FormInput
            id="budget-limit"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            label="Monthly limit (₹)"
            placeholder="e.g. 5000"
            error={errors.monthlyLimit?.message}
            {...register('monthlyLimit')}
          />
          <p className="text-xs text-text-muted dark:text-[#94A3B8] -mt-3">
            Alert fires when spending reaches 80% of this limit.
          </p>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className={CANCEL_BTN}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || (!isEditMode && selectableCategories.length === 0)}
              className={SUBMIT_BTN}
            >
              {mutation.isPending && <LoadingSpinner size="sm" />}
              <span>{isEditMode ? 'Save changes' : 'Set budget'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
