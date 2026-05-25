import { useEffect } from 'react';
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  PieChart,
  Receipt,
  Tag,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/expenses',   label: 'Expenses',   icon: Receipt },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/budgets',    label: 'Budgets',    icon: PieChart },
  { to: '/reports',    label: 'Reports',    icon: BarChart3 },
  { to: '/users',      label: 'Users',      icon: Users,         adminOnly: true },
  { to: '/audit-log',  label: 'Audit Log',  icon: ClipboardList, adminOnly: true },
];

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={
        'h-[84px] border-b border-border dark:border-[#1F2A44] flex items-center gap-3 flex-shrink-0 ' +
        (collapsed ? 'justify-center px-0' : 'px-6')
      }
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'linear-gradient(135deg, #5B5CF0 0%, #7C5CF0 100%)',
          boxShadow: '0 6px 18px -6px rgba(91, 92, 240, 0.65)',
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="14" height="18" rx="2" />
          <path d="M8 8h6M8 12h6M8 16h4" />
          <path d="M18 3v18" />
        </svg>
      </div>
      {!collapsed && (
        <div className="text-[17px] font-bold tracking-tight text-text-primary dark:text-[#F5F7FF] whitespace-nowrap">
          ExpenseTrack
        </div>
      )}
    </div>
  );
}

interface SidebarBodyProps {
  collapsed: boolean;
  onItemClick?: () => void;
}

function SidebarBody({ collapsed, onItemClick }: SidebarBodyProps) {
  const { isAdmin } = useAuth();
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <>
      <Logo collapsed={collapsed} />

      {/* Nav — intentionally NO flex-1 so items sit naturally under the logo
          and the rest of the sidebar stays empty, per design spec. */}
      <nav className={'py-4 flex flex-col gap-1 overflow-y-auto ' + (collapsed ? 'px-2' : 'px-3')}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onItemClick}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              'group h-11 w-full rounded-xl flex items-center text-[14px] font-medium transition-colors duration-150 shrink-0 ' +
              (collapsed ? 'justify-center px-0 ' : 'gap-3 px-3.5 ') +
              (isActive
                ? 'bg-accent text-white shadow-[0_8px_22px_-10px_rgba(91,92,240,0.7)]'
                : 'text-text-muted dark:text-[#94A3B8] hover:bg-accent-soft hover:text-accent dark:hover:text-accent')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={isActive ? 'text-white' : 'text-text-muted dark:text-[#94A3B8] group-hover:text-accent'}
                  aria-hidden="true"
                />
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  // Sticky to the viewport so the nav stays pinned while the main content scrolls.
  // Arbitrary-value dark bg sidesteps a Tailwind JIT quirk where `dark:` + a
  // color path containing `dark` (surface-dark-sidebar) wasn't always emitted.
  const width = collapsed ? 76 : 248;
  return (
    <aside
      className={
        'hidden lg:flex shrink-0 flex-col ' +
        'bg-white dark:bg-[#17233D] ' +
        'border-r border-border dark:border-[#1F2A44] ' +
        'transition-[width] duration-300 ease-out overflow-hidden ' +
        'sticky top-0 self-start h-screen z-30'
      }
      style={{ width }}
    >
      <SidebarBody collapsed={collapsed} />
    </aside>
  );
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <div className={'lg:hidden fixed inset-0 z-50 ' + (open ? '' : 'pointer-events-none')}>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={'absolute inset-0 transition-opacity duration-300 ' + (open ? 'opacity-100' : 'opacity-0')}
        style={{ background: 'rgba(8, 16, 40, 0.55)', backdropFilter: 'blur(4px)' }}
      />
      <aside
        className={
          'absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] ' +
          'bg-white dark:bg-[#17233D] ' +
          'border-r border-border dark:border-[#2D3956] ' +
          'flex flex-col transition-transform duration-300 ease-out shadow-pop ' +
          (open ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <SidebarBody collapsed={false} onItemClick={onClose} />
      </aside>
    </div>
  );
}
