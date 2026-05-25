import { type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  onClick?: () => void;
}

const BASE =
  'flex items-center gap-3 px-3 py-2.5 rounded-xl ' +
  'transition-all duration-200 cursor-pointer w-full text-sm';

const ACTIVE =
  'bg-primary-light dark:bg-primary/15 ' +
  'text-primary dark:text-primary ' +
  'font-medium';

const INACTIVE =
  'text-text-muted dark:text-[#94A3B8] ' +
  'hover:bg-surface-muted dark:hover:bg-[#121B32]/60 ' +
  'hover:text-text-secondary dark:hover:text-text-dark-secondary';

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
