import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Plus,
  Receipt,
  Search,
  Settings,
  Sun,
  Tag,
  User as UserIcon,
  UserPlus,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

import { MenuItem } from '../components/ui/MenuItem';
import { usePopover } from '../hooks/usePopover';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { getInitials } from '../lib/initials';
import { formatCurrency } from '../lib/format';
import { budgetService } from '../api/services/budgetService';
import type { BudgetResponse } from '../types';

interface TopbarProps {
  onOpenMobileDrawer: () => void;
  onToggleCollapse: () => void;
}

const SQUARE_BUTTON =
  'w-10 h-10 rounded-lg bg-white dark:bg-[#1A233A] ' +
  'border border-border dark:border-[#2D3956] ' +
  'text-text-muted dark:text-[#94A3B8] ' +
  'hover:text-text-primary dark:hover:text-[#F5F7FF] ' +
  'transition flex items-center justify-center';

// ────────────────────────────────────────────────────────────
// Quick-add menu (chevron next to Add Expense, dashboard only)
//
// Each item navigates to the page that owns the create form and passes
// `?new=1`; the destination page checks that param on mount, opens its
// form, and clears the param. All four entities are admin-only on the
// backend, matching the visibility of this whole cluster.
// ────────────────────────────────────────────────────────────

function QuickAddMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const go = (path: string) => {
    onClose();
    navigate(`${path}?new=1`);
  };
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[280px] rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop p-1.5 z-40 fade-up">
      <div className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-[#94A3B8]">
        Quick add
      </div>
      <MenuItem icon={Receipt}  label="New expense"  sub="Add a new expense entry"  color="#5B5CF0" onClick={() => go('/expenses')}   />
      <MenuItem icon={Wallet}   label="New budget"   sub="Set a category limit"     color="#10B981" onClick={() => go('/budgets')}    />
      <MenuItem icon={Tag}      label="New category" sub="Add a spending category"  color="#38BDF8" onClick={() => go('/categories')} />
      <MenuItem icon={UserPlus} label="New user"     sub="Invite a teammate"        color="#F59E0B" onClick={() => go('/users')}      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Notifications popover (bell)
//
// Sourced from real budget data — over-limit and near-limit budgets become
// notification items. The backend has no general-purpose notification stream,
// so budget alerts are the only signal we know how to surface accurately.
// ────────────────────────────────────────────────────────────

type Tone = 'danger' | 'warning' | 'success';

const TONE: Record<Tone, { bg: string; fg: string; Icon: LucideIcon }> = {
  danger:  { bg: 'rgba(239, 68, 68, 0.13)',  fg: '#EF4444', Icon: AlertCircle    },
  warning: { bg: 'rgba(245, 158, 11, 0.13)', fg: '#F59E0B', Icon: AlertTriangle  },
  success: { bg: 'rgba(16, 185, 129, 0.13)', fg: '#10B981', Icon: CheckCircle2   },
};

function toneFor(b: BudgetResponse): Tone {
  if (b.isOverBudget) return 'danger';
  if (b.isNearLimit) return 'warning';
  return 'success';
}

interface NotificationsPopoverProps {
  onClose: () => void;
  budgets: BudgetResponse[];
  isLoading: boolean;
  isError: boolean;
}

function NotificationsPopover({ onClose, budgets, isLoading, isError }: NotificationsPopoverProps) {
  const navigate = useNavigate();
  // Surface only budgets that are actually alerting; show the most pressing first.
  const alerts = budgets
    .filter((b) => b.isOverBudget || b.isNearLimit)
    .sort((a, b) => b.percentageUsed - a.percentageUsed)
    .slice(0, 6);

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop p-1.5 z-40 fade-up">
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-border dark:border-[#1F2A44] mb-1">
        <div className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF]">Notifications</div>
        <span className="text-[11.5px] font-semibold text-text-muted dark:text-[#94A3B8] tnum">
          {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
        </span>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {isLoading && (
          <div className="px-3 py-6 text-center text-[12.5px] text-text-muted dark:text-[#94A3B8]">Loading…</div>
        )}

        {!isLoading && isError && (
          <div className="px-3 py-6 text-center text-[12.5px] text-danger">Couldn't load alerts.</div>
        )}

        {!isLoading && !isError && alerts.length === 0 && (
          <div className="flex flex-col items-center text-center px-3 py-6">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
              style={{ background: TONE.success.bg, color: TONE.success.fg }}
              aria-hidden="true"
            >
              <CheckCircle2 size={16} />
            </div>
            <div className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF]">
              All budgets on track
            </div>
            <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">
              You'll see alerts here when any budget hits 80%+.
            </div>
          </div>
        )}

        {!isLoading && !isError && alerts.map((b) => {
          const tone = toneFor(b);
          const t = TONE[tone];
          const Icon = t.Icon;
          const pct = Math.round(b.percentageUsed);
          const spent = Number(b.spent || 0);
          const limit = Number(b.monthlyLimit || 0);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                onClose();
                navigate('/budgets');
              }}
              className="w-full text-left flex items-start gap-3 px-2.5 py-2.5 rounded-lg hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: t.bg, color: t.fg }}
                aria-hidden="true"
              >
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">
                  {b.categoryName} at {pct}%
                </div>
                <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate mt-0.5 tnum">
                  {formatCurrency(spent)} / {formatCurrency(limit)}
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: t.fg }} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="border-t border-border dark:border-[#1F2A44] mt-1 pt-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/budgets');
          }}
          className="w-full h-10 rounded-lg text-[12.5px] font-semibold text-accent hover:bg-surface-muted dark:hover:bg-[#121B32]/60 transition"
        >
          View all budgets
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Profile menu (chevron next to avatar)
// ────────────────────────────────────────────────────────────

interface ProfileMenuProps {
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

function ProfileMenu({ onClose, isDark, onToggleTheme, onLogout }: ProfileMenuProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const go = (path: string) => {
    onClose();
    navigate(path);
  };
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[260px] rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#2D3956] shadow-pop p-1.5 z-40 fade-up">
      <div className="px-3 pt-2.5 pb-2.5 flex items-center gap-3 border-b border-border dark:border-[#1F2A44] mb-1">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[13px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #5B5CF0 0%, #38BDF8 100%)' }}
          aria-hidden="true"
        >
          {getInitials(user?.fullName)}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF] truncate">
            {user?.fullName ?? '—'}
          </div>
          <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] truncate">
            {user?.email ?? '—'}
          </div>
        </div>
      </div>
      <MenuItem icon={UserIcon} label="View profile" color="#5B5CF0" onClick={() => go('/profile')} />
      <MenuItem icon={Settings} label="Settings"     color="#94A3B8" onClick={() => go('/settings')} />
      <MenuItem
        icon={isDark ? Sun : Moon}
        label={isDark ? 'Light mode' : 'Dark mode'}
        color="#F59E0B"
        onClick={() => { onToggleTheme(); onClose(); }}
      />
      <div className="border-t border-border dark:border-[#1F2A44] my-1" />
      <MenuItem icon={LogOut} label="Sign out" danger onClick={() => { onClose(); onLogout(); }} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Topbar
// ────────────────────────────────────────────────────────────

export function Topbar({ onOpenMobileDrawer, onToggleCollapse }: TopbarProps) {
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useDarkMode();
  const navigate = useNavigate();

  const add  = usePopover<HTMLDivElement>();
  const bell = usePopover<HTMLDivElement>();
  const prof = usePopover<HTMLDivElement>();

  const location = useLocation();
  const onDashboard = location.pathname === '/dashboard';

  // Budget alerts feed both the badge count and the popover. Cached via the
  // same key the budgets page uses, so opening the bell doesn't double-fetch.
  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetService.getBudgets,
  });
  const alertCount = (budgetsQuery.data ?? []).filter(
    (b) => b.isOverBudget || b.isNearLimit,
  ).length;

  const handleAddExpense = () => navigate('/expenses');
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      className={
        'sticky top-0 z-30 h-[72px] sm:h-[76px] px-4 sm:px-6 lg:px-7 ' +
        'flex items-center justify-between gap-3 sm:gap-4 ' +
        'border-b border-border dark:border-[#1F2A44] ' +
        'bg-surface-muted/85 dark:bg-[#081028]/85 backdrop-blur ' +
        'pt-[env(safe-area-inset-top)] transition-colors duration-200'
      }
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Mobile drawer opener */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          aria-label="Open navigation menu"
          title="Open menu"
          className={'lg:hidden ' + SQUARE_BUTTON}
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        {/* Desktop sidebar collapse */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className={'hidden lg:flex ' + SQUARE_BUTTON}
        >
          <PanelLeft size={16} aria-hidden="true" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-[440px] relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-[#94A3B8]"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search expenses, categories…"
            className={
              'w-full h-10 rounded-lg bg-white dark:bg-[#1A233A] ' +
              'border border-border dark:border-[#2D3956] ' +
              'pl-10 pr-3 sm:pr-14 text-[13px] ' +
              'text-text-primary dark:text-[#F5F7FF] ' +
              'placeholder:text-text-muted dark:placeholder:text-[#94A3B8] ' +
              'focus:border-accent/60 transition-colors'
            }
          />
          <kbd
            className={
              'hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 ' +
              'h-[20px] px-1.5 items-center gap-1 rounded ' +
              'border border-border dark:border-[#2D3956] ' +
              'text-[10.5px] text-text-muted dark:text-[#94A3B8] font-mono'
            }
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right cluster — theme toggle now lives inside the profile menu */}
      <div className="flex items-center gap-2">
        {/* Quick-add split button — dashboard only, admin only. Other pages
            have their own contextual Add button so this stays scoped. */}
        {isAdmin && onDashboard && (
          <div ref={add.ref} className="relative">
            <div
              className="flex h-10 rounded-lg overflow-hidden shadow-[0_8px_18px_-8px_rgba(91,92,240,0.65)]"
              style={{ background: 'linear-gradient(180deg, #6B6CF5 0%, #5050E8 100%)' }}
            >
              <button
                type="button"
                onClick={handleAddExpense}
                className="px-3 sm:px-3.5 flex items-center gap-1.5 sm:gap-2 text-[13px] font-semibold text-white hover:brightness-110 transition"
              >
                <Plus size={15} aria-hidden="true" />
                <span className="hidden sm:inline">Add Expense</span>
              </button>
              <div className="w-px bg-white/15" />
              <button
                type="button"
                onClick={() => add.setOpen((o) => !o)}
                aria-label="More add options"
                className="px-2 flex items-center text-white/90 hover:bg-white/10 transition"
              >
                <ChevronDown
                  size={14}
                  className={'transition-transform ' + (add.open ? 'rotate-180' : '')}
                  aria-hidden="true"
                />
              </button>
            </div>
            {add.open && <QuickAddMenu onClose={() => add.setOpen(false)} />}
          </div>
        )}

        {/* Notifications */}
        <div ref={bell.ref} className="relative">
          <button
            type="button"
            onClick={() => bell.setOpen((o) => !o)}
            aria-label={
              alertCount > 0
                ? `Notifications, ${alertCount} alert${alertCount === 1 ? '' : 's'}`
                : 'Notifications'
            }
            title="Notifications"
            className={'relative ' + SQUARE_BUTTON}
          >
            <Bell size={18} aria-hidden="true" />
            {alertCount > 0 && (
              <>
                {/* Soft pulse halo behind the badge — purely decorative. */}
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-danger/40 animate-ping"
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10.5px] font-bold leading-none tnum flex items-center justify-center shadow-[0_2px_6px_-1px_rgba(239,68,68,0.55)]"
                >
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              </>
            )}
          </button>
          {bell.open && (
            <NotificationsPopover
              onClose={() => bell.setOpen(false)}
              budgets={budgetsQuery.data ?? []}
              isLoading={budgetsQuery.isLoading}
              isError={budgetsQuery.isError}
            />
          )}
        </div>

        {/* Profile — compact: avatar + name only (theme toggle lives in the menu) */}
        <div ref={prof.ref} className="relative">
          <button
            type="button"
            onClick={() => prof.setOpen((o) => !o)}
            className="h-10 pl-1 pr-2 sm:pr-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-muted dark:hover:bg-[#121B32] transition"
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-[11.5px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #5B5CF0 0%, #38BDF8 100%)' }}
              aria-hidden="true"
            >
              {getInitials(user?.fullName)}
            </div>
            <span className="hidden md:inline text-[13px] font-semibold text-text-primary dark:text-[#F5F7FF] leading-tight">
              {user?.fullName ?? '—'}
            </span>
            <ChevronDown
              size={13}
              className={'text-text-muted dark:text-[#94A3B8] hidden md:block transition-transform ' + (prof.open ? 'rotate-180' : '')}
              aria-hidden="true"
            />
          </button>
          {prof.open && (
            <ProfileMenu
              onClose={() => prof.setOpen(false)}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
}

