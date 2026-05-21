import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { getRouteTitle } from '../config/routeMeta';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { getInitials } from '../lib/initials';

interface TopbarProps {
  onOpenSidebar: () => void;
}

const ICON_BUTTON =
  'p-2 rounded-lg text-gray-500 dark:text-gray-400 ' +
  'hover:bg-gray-100 dark:hover:bg-gray-800 ' +
  'transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const title = getRouteTitle(location.pathname);

  return (
    <header
      className={
        'sticky top-0 z-30 ' +
        'bg-white dark:bg-gray-900 ' +
        'border-b border-gray-100 dark:border-gray-800 ' +
        'px-6 py-4 flex items-center gap-4 ' +
        'pt-[calc(env(safe-area-inset-top)+1rem)] ' +
        'transition-colors duration-200'
      }
    >
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
        className={'md:hidden ' + ICON_BUTTON}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={ICON_BUTTON}
        >
          {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className={ICON_BUTTON}
        >
          <Bell size={18} aria-hidden="true" />
        </button>

        <div
          className={
            'w-8 h-8 rounded-full bg-primary-light text-primary ' +
            'flex items-center justify-center text-sm font-medium ml-1'
          }
          aria-hidden="true"
          title={user?.fullName}
        >
          {getInitials(user?.fullName)}
        </div>
      </div>
    </header>
  );
}
