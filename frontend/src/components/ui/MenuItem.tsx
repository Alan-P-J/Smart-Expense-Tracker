import type { LucideIcon } from 'lucide-react';

interface MenuItemProps {
  icon?: LucideIcon;
  label: string;
  sub?: string;
  color?: string; // hex tint for the icon tile
  danger?: boolean;
  onClick?: () => void;
}

export function MenuItem({ icon: Icon, label, sub, color, danger, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full text-left h-11 px-2.5 rounded-lg flex items-center gap-3 text-[13px] font-medium transition ' +
        (danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-text-primary dark:text-[#F5F7FF] hover:bg-surface-muted dark:hover:bg-[#121B32]/60')
      }
    >
      {Icon && (
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: (color || '#94A3B8') + '1f', color: color || '#94A3B8' }}
          aria-hidden="true"
        >
          <Icon size={15} />
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block truncate">{label}</span>
        {sub && <span className="block text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-0.5 truncate">{sub}</span>}
      </span>
    </button>
  );
}
