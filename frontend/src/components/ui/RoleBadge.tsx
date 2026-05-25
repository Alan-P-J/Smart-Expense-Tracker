import type { Role } from '../../types';

interface RoleBadgeProps {
  role: Role;
}

const STYLES: Record<Role, string> = {
  // ADMIN keeps the indigo-950 / indigo-400 dark-mode primitives — they sit
  // outside the brand `primary` token scale (deeper / lighter respectively).
  ADMIN:
    'bg-primary-light dark:bg-indigo-950 text-primary dark:text-indigo-400',
  VIEWER:
    'bg-surface-muted dark:bg-border-dark-strong text-text-muted dark:text-[#94A3B8]',
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={
        'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ' +
        STYLES[role]
      }
    >
      {role}
    </span>
  );
}
