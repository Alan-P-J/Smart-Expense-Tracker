import { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { X } from 'lucide-react';

import { FormInput } from '../ui/FormInput';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { categoryService } from '../../api/services/categoryService';
import { getCategoryBg, getCategoryIcon } from '../../utils/categoryIconMap';
import type { CategoryRequest, CategoryResponse } from '../../types';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Too long'),
  colourHex: z
    .string()
    .regex(HEX_RE, 'Use a #RRGGBB hex colour'),
  iconName: z
    .string()
    .max(50, 'Too long')
    .optional()
    .or(z.literal('')),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CategoryResponse | null;
  onSuccess: () => void;
}

// 10 preset swatches — picked to read clearly on both light and dark backgrounds.
const SWATCHES = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#4F46E5', '#F97316', '#8B5CF6',
] as const;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SELECT_FIELD =
  'w-full px-3 py-2.5 rounded-lg border ' +
  'border-border-strong dark:border-border-dark-strong ' +
  'bg-surface dark:bg-surface-dark ' +
  'text-text-primary dark:text-text-dark-primary ' +
  'focus:outline-none focus:ring-2 focus:ring-primary ' +
  'transition-colors duration-200';

const LABEL =
  'block text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1';

const CANCEL_BTN =
  'px-4 py-2 rounded-lg border border-border-strong dark:border-border-dark-strong ' +
  'text-text-secondary dark:text-text-dark-secondary text-sm font-medium ' +
  'hover:bg-surface-muted dark:hover:bg-border-dark ' +
  'transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const SUBMIT_BTN =
  'px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium ' +
  'active:scale-[0.98] transition-all duration-200 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'flex items-center gap-2 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function CategoryForm({ isOpen, onClose, initialData, onSuccess }: CategoryFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', colourHex: SWATCHES[0], iconName: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      reset({
        name: initialData.name,
        colourHex: initialData.colourHex,
        iconName: initialData.iconName ?? '',
      });
    } else {
      reset({ name: '', colourHex: SWATCHES[0], iconName: '' });
    }
  }, [isOpen, initialData, reset]);

  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      const payload: CategoryRequest = {
        name: values.name.trim(),
        colourHex: values.colourHex,
        iconName: values.iconName?.trim() || undefined,
      };
      return isEditMode && initialData
        ? categoryService.updateCategory(initialData.id, payload)
        : categoryService.createCategory(payload);
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 409) {
          toast.error('A category with this name already exists');
        } else if (status === 403) {
          toast.error("You don't have permission");
        } else {
          toast.error(err.response?.data?.message ?? 'Something went wrong');
        }
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

  const colourHex = watch('colourHex');
  const iconNameValue = watch('iconName');
  const nameValue = watch('name');
  const PreviewIcon = getCategoryIcon(iconNameValue || null);
  const isValidHex = HEX_RE.test(colourHex);

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
          'bg-surface dark:bg-surface-dark ' +
          'rounded-2xl border border-border dark:border-border-dark ' +
          'w-full max-w-lg shadow-xl ' +
          'max-h-[90vh] overflow-y-auto'
        }
      >
        <div className="flex justify-between items-center p-6 pb-0">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
            {isEditMode ? 'Edit category' : 'Add category'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={
              'p-2 rounded-lg text-text-muted dark:text-text-dark-muted ' +
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
          <FormInput
            id="category-name"
            label="Name"
            placeholder="e.g. Travel"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <label className={LABEL}>Colour</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SWATCHES.map((hex) => {
                const selected = colourHex.toUpperCase() === hex.toUpperCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Use colour ${hex}`}
                    aria-pressed={selected}
                    onClick={() => setValue('colourHex', hex, { shouldDirty: true })}
                    className={
                      'w-8 h-8 rounded-lg transition-transform duration-150 ' +
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' +
                      (selected ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105')
                    }
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Custom colour"
                value={isValidHex ? colourHex : '#000000'}
                onChange={(e) => setValue('colourHex', e.target.value.toUpperCase(), { shouldDirty: true })}
                className="w-10 h-10 rounded-lg border border-border-strong dark:border-border-dark-strong bg-transparent cursor-pointer"
              />
              <input
                type="text"
                aria-label="Colour hex code"
                {...register('colourHex')}
                className={SELECT_FIELD + ' font-mono text-sm flex-1'}
                placeholder="#RRGGBB"
              />
            </div>
            {errors.colourHex && (
              <p className="text-sm text-danger mt-1">{errors.colourHex.message}</p>
            )}
          </div>

          <FormInput
            id="category-icon"
            label="Icon name (optional)"
            placeholder="e.g. plane, coffee, home"
            error={errors.iconName?.message}
            {...register('iconName')}
          />
          <p className="text-xs text-text-muted dark:text-text-dark-muted -mt-3">
            Uses Lucide icon names. Unknown names fall back to a receipt icon.
          </p>

          {/* Live preview ─ shows the card pill exactly as it will render in
              the grid. Re-renders on any field change. */}
          <div className="rounded-lg border border-border dark:border-border-dark p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted dark:text-text-dark-muted mb-2">
              Preview
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: isValidHex ? colourHex : getCategoryBg('#CCCCCC') }}
              >
                <PreviewIcon size={18} color="white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-text-primary dark:text-text-dark-primary truncate">
                  {nameValue || 'Category name'}
                </p>
                <p className="text-xs text-text-muted dark:text-text-dark-muted font-mono">
                  {isValidHex ? colourHex.toUpperCase() : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className={CANCEL_BTN}>
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className={SUBMIT_BTN}>
              {mutation.isPending && <LoadingSpinner size="sm" />}
              <span>{isEditMode ? 'Save changes' : 'Add category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
