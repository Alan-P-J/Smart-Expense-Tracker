import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Eye, EyeOff, X } from 'lucide-react';

import { FormInput } from '../ui/FormInput';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { userService } from '../../api/services/userService';
import type { CreateUserRequest, Role } from '../../types';

const createUserSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(100, 'Too long'),
  email: z.email('Invalid email').max(255, 'Too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Too long'),
  role: z.enum(['ADMIN', 'VIEWER']),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CreateUserForm({ isOpen, onClose, onSuccess }: CreateUserFormProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', password: '', role: 'VIEWER' satisfies Role },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ fullName: '', email: '', password: '', role: 'VIEWER' });
    setShowPassword(false);
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (values: CreateUserFormValues) => {
      const payload: CreateUserRequest = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
      };
      return userService.createUser(payload);
    },
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 409) toast.error('Email already exists');
        else if (status === 403) toast.error("You don't have permission");
        else if (status === 400) toast.error(err.response?.data?.message ?? 'Validation failed');
        else toast.error('Failed to create user');
      } else {
        toast.error('Failed to create user');
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
          'bg-surface dark:bg-surface-dark ' +
          'rounded-2xl border border-border dark:border-border-dark ' +
          'w-full max-w-lg shadow-xl ' +
          'max-h-[90vh] overflow-y-auto'
        }
      >
        <div className="flex justify-between items-center p-6 pb-0">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
            Add user
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
            id="user-fullname"
            label="Full name"
            placeholder="e.g. Anita Devi"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <FormInput
            id="user-email"
            type="email"
            label="Email"
            placeholder="name@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <FormInput
            id="user-password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-text-muted dark:text-text-dark-muted hover:text-text-secondary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            {...register('password')}
          />

          <div>
            <label htmlFor="user-role" className={LABEL}>
              Role
            </label>
            <select
              id="user-role"
              className={SELECT_FIELD}
              {...register('role')}
            >
              <option value="VIEWER">Viewer — read-only</option>
              <option value="ADMIN">Admin — full access</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className={CANCEL_BTN}>
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className={SUBMIT_BTN}>
              {mutation.isPending && <LoadingSpinner size="sm" />}
              <span>Create user</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
