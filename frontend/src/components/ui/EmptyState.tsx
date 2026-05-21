import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <Icon size={48} className="text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={
            'mt-4 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white ' +
            'text-sm font-medium transition-colors duration-200 ' +
            'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          }
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
