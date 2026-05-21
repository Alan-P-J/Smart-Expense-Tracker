import { useEffect } from 'react';
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PieChart,
  Receipt,
  Tag,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SidebarItem } from '../components/ui/SidebarItem';
import { RoleBadge } from '../components/ui/RoleBadge';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../lib/initials';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // ESC closes mobile drawer.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Backdrop — mobile only, click closes the drawer */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={
          'md:hidden fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ' +
          (open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
      />

      <aside
        className={
          'flex flex-col w-60 flex-shrink-0 ' +
          'bg-surface dark:bg-surface-dark ' +
          'border-r border-border dark:border-border-dark ' +
          'transition-all duration-300 ease-in-out ' +
          'pt-[env(safe-area-inset-top)] ' +
          // Mobile: fixed drawer with slide animation; Desktop: in-flow.
          'fixed md:static inset-y-0 left-0 z-50 ' +
          (open ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
        }
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 flex-shrink-0">
          <Receipt size={22} className="text-primary" aria-hidden="true" />
          <span className="text-primary font-semibold text-base">ExpenseTrack</span>
        </div>

        {/* Nav (scrollable if needed) */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard"  to="/dashboard"  onClick={onClose} />
          <SidebarItem icon={Receipt}         label="Expenses"   to="/expenses"   onClick={onClose} />
          <SidebarItem icon={Tag}             label="Categories" to="/categories" onClick={onClose} />
          <SidebarItem icon={PieChart}        label="Budgets"    to="/budgets"    onClick={onClose} />
          {isAdmin && (
            <>
              <SidebarItem icon={Users}         label="Users"      to="/users"     onClick={onClose} />
              <SidebarItem icon={ClipboardList} label="Audit Log"  to="/audit-log" onClick={onClose} />
            </>
          )}
        </nav>

        {/* User profile (sticky bottom) */}
        <div className="sticky bottom-0 bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark p-4">
          <div className="flex items-center gap-3">
            <div
              className={
                'w-8 h-8 rounded-full bg-primary-light text-primary ' +
                'flex items-center justify-center text-sm font-medium flex-shrink-0'
              }
              aria-hidden="true"
            >
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate">
                {user?.fullName ?? '—'}
              </p>
              <div className="mt-0.5">{user && <RoleBadge role={user.role} />}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className={
                'p-2 rounded-lg text-text-muted dark:text-text-dark-muted ' +
                'hover:text-danger transition-colors duration-200 ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              }
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
