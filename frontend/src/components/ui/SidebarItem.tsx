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
  'shadow-[inset_2px_0_0_0_theme(colors.primary.DEFAULT)] ' +
  'font-medium';

const INACTIVE =
  'text-text-muted dark:text-text-dark-muted ' +
  'hover:bg-surface-muted dark:hover:bg-border-dark-strong/50';

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
