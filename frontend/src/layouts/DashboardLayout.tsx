import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile drawer when route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={
        'flex min-h-screen bg-gray-50 dark:bg-gray-950 ' +
        'transition-colors duration-200'
      }
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* min-w-0 prevents flex children from expanding past viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
