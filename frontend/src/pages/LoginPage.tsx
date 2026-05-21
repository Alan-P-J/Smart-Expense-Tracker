import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Receipt } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import { FormInput } from '../components/ui/FormInput';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Already logged in — bounce to dashboard. (Wait for /me probe to resolve.)
  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status === 401) {
          toast.error('Invalid email or password');
        } else if (status && status >= 500) {
          toast.error('Server error, please try again');
        } else if (!err.response) {
          toast.error('Cannot connect to server');
        } else {
          toast.error(err.response.data?.message ?? 'Login failed');
        }
      } else {
        toast.error('Login failed');
      }
    }
  };

  return (
    <div
      className={
        'min-h-screen bg-surface-muted dark:bg-surface-dark-muted ' +
        'flex items-center justify-center px-4 py-12 ' +
        'transition-colors duration-200'
      }
    >
      <div
        className={
          'w-full max-w-md ' +
          'bg-surface dark:bg-surface-dark ' +
          'rounded-2xl shadow-xl ' +
          'border border-border dark:border-border-dark ' +
          'p-8 space-y-6 ' +
          'transition-colors duration-200'
        }
      >
        {/* Logo + heading */}
        <div className="text-center space-y-2 pb-6 border-b border-border dark:border-border-dark">
          <div className="inline-flex items-center justify-center mb-2">
            <Receipt size={32} className="text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-primary">ExpenseTrack</h1>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormInput
            id="login-email"
            type="email"
            autoComplete="email"
            label="Email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <FormInput
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={
                  'p-1.5 rounded-md text-text-muted hover:text-text-secondary ' +
                  'dark:hover:text-text-dark-secondary transition-colors duration-200 ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register('password')}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={
              'w-full bg-primary hover:bg-primary-hover text-white ' +
              'rounded-lg py-2.5 font-medium ' +
              'transition-all duration-200 ' +
              'active:scale-[0.98] ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' +
              'disabled:opacity-50 disabled:cursor-not-allowed ' +
              'flex items-center justify-center gap-2'
            }
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
          </button>

          <p className="text-xs text-center text-text-muted dark:text-text-dark-muted mt-4">
            Secure access to your expense workspace
          </p>
        </form>
      </div>
    </div>
  );
}
