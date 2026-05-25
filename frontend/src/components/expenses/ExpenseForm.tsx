import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { X } from 'lucide-react';

import { FormInput } from '../ui/FormInput';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { expenseService } from '../../api/services/expenseService';
import type { CategoryResponse, ExpenseRequest, ExpenseResponse } from '../../types';

/**
 * Amount is validated as a STRING (not number) to avoid floating-point
 * precision bugs around .multipleOf(0.01). The backend already accepts
 * a string here (BigDecimal-as-string), so we keep canonical decimal
 * representation end-to-end.
 *
 * Accepts:  "100", "100.5", "100.50"
 * Rejects:  "100.555", "abc", "", "-5", " 100"
 */
const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

const expenseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Too long'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(AMOUNT_REGEX, 'Enter a valid amount (up to 2 decimal places)')
    .refine((v) => Number.parseFloat(v) > 0, 'Amount must be positive'),
  expenseDate: z.string().min(1, 'Date is required'),
  categoryId: z.number({ error: 'Select a category' }).positive('Select a category'),
  description: z.string().max(500).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ExpenseResponse | null;
  categories: CategoryResponse[];
  onSuccess: () => void;
}

const SELECT_FIELD =
  'w-full px-3 py-2.5 rounded-lg border ' +
  'border-border-strong dark:border-[#2D3956] ' +
  'bg-surface dark:bg-[#1A233A] ' +
  'text-text-primary dark:text-[#F5F7FF] ' +
  'focus:outline-none focus:ring-2 focus:ring-primary ' +
  'transition-colors duration-200';

const TEXTAREA_FIELD = SELECT_FIELD + ' resize-y';

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

// Anything keyboard-focusable inside the modal. Used by the focus trap.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ExpenseForm({
  isOpen,
  onClose,
  initialData,
  categories,
  onSuccess,
}: ExpenseFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;
  const titleId = useId();

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: '',
      expenseDate: '',
      categoryId: 0,
      description: '',
    },
  });

  // Pre-fill on edit / clear on add when the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      reset({
        title: initialData.title,
        amount: String(initialData.amount),   // backend returns BigDecimal-as-string
        expenseDate: initialData.expenseDate,
        categoryId: initialData.categoryId,
        description: initialData.description ?? '',
      });
    } else {
      reset({
        title: '',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        categoryId: 0,
        description: '',
      });
    }
  }, [isOpen, initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => {
      const payload: ExpenseRequest = {
        title: values.title,
        amount: values.amount, // already canonical string, no float roundtrip
        expenseDate: values.expenseDate,
        categoryId: values.categoryId,
        description: values.description || undefined,
      };
      return isEditMode && initialData
        ? expenseService.updateExpense(initialData.id, payload)
        : expenseService.createExpense(payload);
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Expense updated successfully' : 'Expense added successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
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

  // ── Focus management ────────────────────────────────────────────────
  // On open: remember whatever was focused (the "Add expense" button, an
  // edit icon, etc.) and put focus on the first form field. On close:
  // restore the original element so keyboard users land back where they
  // were.
  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  // ── Close intent + dirty protection ─────────────────────────────────
  // Backdrop click, ESC, X, Cancel — all funnel through here. If the
  // form has been touched we ask first; otherwise close immediately.
  // Mutation state is read via the mutation object closure.
  const requestClose = () => {
    if (isDirty && !mutation.isPending) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Keyboard handlers: ESC closes (via requestClose), Tab/Shift-Tab is trapped.
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // While the discard confirm is open, let its own listener handle ESC.
        if (!showDiscardConfirm) {
          e.preventDefault();
          requestClose();
        }
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusables = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
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
    // requestClose closes over isDirty + mutation.isPending; re-bind when
    // those change so the trap always uses the latest values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showDiscardConfirm, isDirty, mutation.isPending]);

  if (!isOpen) return null;

  const categoryIdValue = watch('categoryId');
  const selectedCategory = categories.find((c) => c.id === categoryIdValue);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 transition-opacity duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={requestClose}
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
              {isEditMode ? 'Edit expense' : 'Add expense'}
            </h2>
            <button
              type="button"
              onClick={requestClose}
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

          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="p-6 space-y-4" noValidate>
            <FormInput
              id="expense-title"
              label="Title"
              placeholder="e.g. Team lunch"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="expense-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                label="Amount (₹)"
                placeholder="0.00"
                error={errors.amount?.message}
                // No valueAsNumber — we validate as canonical decimal string.
                {...register('amount')}
              />
              <FormInput
                id="expense-date"
                type="date"
                label="Date"
                error={errors.expenseDate?.message}
                {...register('expenseDate')}
              />
            </div>

            <div>
              <label htmlFor="expense-category" className={LABEL}>
                Category
              </label>
              <select
                id="expense-category"
                className={SELECT_FIELD}
                aria-invalid={!!errors.categoryId}
                {...register('categoryId', { valueAsNumber: true })}
              >
                <option value={0}>Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCategory.colourHex }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-text-muted dark:text-[#94A3B8]">
                    {selectedCategory.name}
                  </span>
                </div>
              )}
              {errors.categoryId && (
                <p className="text-sm text-danger mt-1">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="expense-description" className={LABEL}>
                Description (optional)
              </label>
              <textarea
                id="expense-description"
                rows={3}
                placeholder="Optional description..."
                className={TEXTAREA_FIELD}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-danger mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={requestClose} className={CANCEL_BTN}>
                Cancel
              </button>
              <button type="submit" disabled={mutation.isPending} className={SUBMIT_BTN}>
                {mutation.isPending && <LoadingSpinner size="sm" />}
                <span>{isEditMode ? 'Save changes' : 'Add expense'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dirty-form guard: stacks on top of the form modal (same z-50,
          rendered later → wins paint order). */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard unsaved changes?"
        message="Your edits will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Continue editing"
        variant="warning"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
