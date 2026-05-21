import { type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  onClick?: () => void;
}

const BASE =
  'flex items-center gap-3 px-4 py-2.5 rounded-lg ' +
  'transition-all duration-200 cursor-pointer w-full text-sm';

const ACTIVE =
  'bg-primary-light dark:bg-indigo-950 ' +
  'text-primary dark:text-indigo-400 ' +
  'shadow-[inset_2px_0_0_0_#4F46E5] ' +
  'font-medium';

const INACTIVE =
  'text-gray-600 dark:text-gray-400 ' +
  'hover:bg-gray-50 dark:hover:bg-gray-800/50';

export function SidebarItem({ icon: Icon, label, to, onClick }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `${BASE} ${isActive ? ACTIVE : INACTIVE}`}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}
