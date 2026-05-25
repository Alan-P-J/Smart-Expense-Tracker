import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { MobileDrawer, Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed';

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const location = useLocation();

  // Auto-close mobile drawer when route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-surface-muted dark:bg-[#081028] text-text-primary dark:text-[#F5F7FF] transition-colors duration-200">
      <Sidebar collapsed={collapsed} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenMobileDrawer={() => setMobileOpen(true)}
          onToggleCollapse={toggleCollapsed}
        />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
