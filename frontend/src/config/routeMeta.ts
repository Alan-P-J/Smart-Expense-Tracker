export interface RouteMeta {
  path: string;
  title: string;
  adminOnly?: boolean;
}

export const routeMeta: RouteMeta[] = [
  { path: '/dashboard',  title: 'Dashboard' },
  { path: '/expenses',   title: 'Expenses' },
  { path: '/categories', title: 'Categories' },
  { path: '/budgets',    title: 'Budgets' },
  { path: '/users',      title: 'User Management', adminOnly: true },
  { path: '/audit-log',  title: 'Audit Log',       adminOnly: true },
];

export function getRouteTitle(pathname: string): string {
  const match = routeMeta.find((r) => pathname.startsWith(r.path));
  return match?.title ?? 'Dashboard';
}
