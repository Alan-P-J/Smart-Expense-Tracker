import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
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

interface FeatureBulletProps {
  icon: typeof Wallet;
  iconColor: string;
  title: string;
  desc: string;
}

function FeatureBullet({ icon: Icon, iconColor, title, desc }: FeatureBulletProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm"
        style={{ background: iconColor + '22', color: iconColor }}
        aria-hidden="true"
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-white">{title}</div>
        <div className="text-[12.5px] text-white/70 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

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

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-surface-muted dark:bg-[#081028] grid lg:grid-cols-[1.1fr_1fr] transition-colors duration-200">
      {/* ─── Left pane: brand showcase (hidden on mobile) ─── */}
      <aside
        className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{
          background:
            'linear-gradient(135deg, #5B5CF0 0%, #6C5CE7 45%, #4338CA 100%)',
        }}
      >
        {/* Decorative blur orbs */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 60%)', filter: 'blur(60px)' }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-24 w-[460px] h-[460px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, #38BDF8 0%, transparent 60%)', filter: 'blur(80px)' }}
        />
        {/* Subtle grid overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.16)', boxShadow: '0 6px 18px -6px rgba(0,0,0,0.35)' }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="14" height="18" rx="2" />
              <path d="M8 8h6M8 12h6M8 16h4" />
              <path d="M18 3v18" />
            </svg>
          </div>
          <div className="text-[18px] font-bold tracking-tight">ExpenseTrack</div>
        </div>

        {/* Pitch */}
        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-2 px-2.5 h-7 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-semibold tracking-wider uppercase mb-5">
            <Sparkles size={12} aria-hidden="true" /> Finance, simplified
          </div>
          <h2 className="text-[34px] font-bold tracking-tight leading-tight">
            Every rupee, accounted for.
          </h2>
          <p className="text-[14.5px] text-white/75 mt-3 leading-relaxed">
            ExpenseTrack keeps your team's spending visible, your budgets honest, and your end-of-month
            close painless — all from one workspace.
          </p>

          <div className="mt-8 flex flex-col gap-5">
            <FeatureBullet
              icon={Wallet}
              iconColor="#10B981"
              title="Track every expense"
              desc="Log spend in seconds and group it by category, budget, or person."
            />
            <FeatureBullet
              icon={BarChart3}
              iconColor="#38BDF8"
              title="Spot trends instantly"
              desc="Live dashboards and category breakdowns answer 'where did the money go?'"
            />
            <FeatureBullet
              icon={ShieldCheck}
              iconColor="#F59E0B"
              title="Safe by default"
              desc="Role-based access, audit logs and BCrypt-hashed passwords ship out of the box."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-[11.5px] text-white/55 tnum">© {year} ExpenseTrack · Built for teams.</div>
      </aside>

      {/* ─── Right pane: sign-in card ─── */}
      <main className="flex items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo (left pane is hidden < lg) */}
          <div className="flex flex-col items-center text-center lg:hidden mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: 'linear-gradient(135deg, #5B5CF0 0%, #7C5CF0 100%)',
                boxShadow: '0 8px 24px -10px rgba(91,92,240,0.65)',
              }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="14" height="18" rx="2" />
                <path d="M8 8h6M8 12h6M8 16h4" />
                <path d="M18 3v18" />
              </svg>
            </div>
            <div className="text-[20px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
              ExpenseTrack
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[26px] sm:text-[28px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
              Welcome back
            </h1>
            <p className="text-[13.5px] text-text-muted dark:text-[#94A3B8] mt-1.5">
              Sign in to your ExpenseTrack workspace.
            </p>
          </div>

          {/* Card */}
          <div
            className={
              'rounded-2xl bg-white dark:bg-[#1A233A] ' +
              'border border-border dark:border-[#1F2A44] shadow-card ' +
              'p-6 sm:p-7'
            }
          >
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
                      'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md ' +
                      'text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] ' +
                      'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                    }
                  >
                    {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                }
                {...register('password')}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className={
                  'w-full h-11 rounded-lg text-white text-[14px] font-semibold ' +
                  'flex items-center justify-center gap-2 transition active:scale-[0.98] ' +
                  'shadow-[0_8px_22px_-10px_rgba(91,92,240,0.7)] ' +
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                }
                style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Helper line */}
          <p className="text-[12px] text-center text-text-muted dark:text-[#94A3B8] mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} aria-hidden="true" />
            Encrypted in transit · Cookies are HttpOnly + Secure
          </p>
        </div>
      </main>
    </div>
  );
}
