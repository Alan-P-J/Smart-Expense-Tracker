import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Mail, User as UserIcon } from 'lucide-react';

import { FormInput } from '../components/ui/FormInput';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { RoleBadge } from '../components/ui/RoleBadge';
import { authService } from '../api/services/authService';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../lib/initials';

// Mirrors the server-side validation in ChangePasswordRequest (min 8).
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(72, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current one',
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      authService.changePassword(values.currentPassword, values.newPassword),
    onSuccess: async () => {
      // Backend revokes all refresh tokens and clears auth cookies on success
      // (AuthService.changePassword + cookieUtil.clearAuthCookies). Mirror that
      // on the client so the user goes back to /login intentionally instead of
      // hitting a stray 401 on their next click.
      toast.success('Password updated — please sign in again');
      reset();
      await logout();
      navigate('/login', { replace: true });
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 401) {
          toast.error('Current password is incorrect');
        } else if (status === 400) {
          toast.error(err.response?.data?.message ?? 'Validation failed');
        } else {
          toast.error('Failed to update password');
        }
      } else {
        toast.error('Failed to update password');
      }
    },
  });

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5 max-w-3xl">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
          Profile
        </h1>
        <p className="text-[12.5px] sm:text-[13px] text-text-muted dark:text-[#94A3B8] mt-1">
          Your account details and password
        </p>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-[20px] font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B5CF0 0%, #38BDF8 100%)' }}
            aria-hidden="true"
          >
            {getInitials(user?.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[18px] font-bold text-text-primary dark:text-[#F5F7FF] truncate">
                {user?.fullName ?? '—'}
              </h2>
              {user && <RoleBadge role={user.role} />}
            </div>
            <p className="text-[13px] text-text-muted dark:text-[#94A3B8] truncate mt-0.5">
              {user?.email ?? '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-border dark:border-[#1F2A44]">
          <ReadOnlyField icon={UserIcon} label="Full name" value={user?.fullName ?? '—'} />
          <ReadOnlyField icon={Mail} label="Email" value={user?.email ?? '—'} />
        </div>

        <p className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-3">
          Name and email are managed by an administrator. Ask one to update them for you.
        </p>
      </div>

      {/* Change password */}
      <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(91, 92, 240, 0.14)', color: '#5B5CF0' }}
            aria-hidden="true"
          >
            <KeyRound size={15} />
          </div>
          <h3 className="text-[15px] font-semibold text-text-primary dark:text-[#F5F7FF]">Change password</h3>
        </div>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <FormInput
            id="current-password"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            label="Current password"
            error={errors.currentPassword?.message}
            trailing={
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition"
              >
                {showCurrent ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            }
            {...register('currentPassword')}
          />

          <FormInput
            id="new-password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            label="New password"
            error={errors.newPassword?.message}
            trailing={
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition"
              >
                {showNew ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              </button>
            }
            {...register('newPassword')}
          />

          <FormInput
            id="confirm-password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            label="Confirm new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <p className="text-[11.5px] text-text-muted dark:text-[#94A3B8]">
            At least 8 characters. Mix letters, numbers and symbols for a stronger password.
          </p>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="h-10 px-4 rounded-lg text-white text-[13px] font-semibold inline-flex items-center gap-2 transition active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
            >
              {mutation.isPending && <LoadingSpinner size="sm" />}
              <span>Update password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ReadOnlyFieldProps {
  icon: typeof UserIcon;
  label: string;
  value: string;
}

function ReadOnlyField({ icon: Icon, label, value }: ReadOnlyFieldProps) {
  return (
    <div className="rounded-xl bg-surface-muted dark:bg-[#121B32] border border-border dark:border-[#1F2A44] px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted dark:text-[#94A3B8]">
        <Icon size={12} aria-hidden="true" />
        {label}
      </div>
      <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] mt-1 truncate">{value}</div>
    </div>
  );
}
