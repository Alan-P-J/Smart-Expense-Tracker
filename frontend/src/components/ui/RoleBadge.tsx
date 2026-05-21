import type { Role } from '../../types';

interface RoleBadgeProps {
  role: Role;
}

const STYLES: Record<Role, string> = {
  ADMIN:
    'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
  VIEWER:
    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
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
