import { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

type Variant = 'danger' | 'warning';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ICON_STYLES: Record<Variant, { bg: string; fg: string }> = {
  danger:  { bg: 'bg-danger/10',  fg: 'text-danger'  },
  warning: { bg: 'bg-warning/10', fg: 'text-warning' },
};

const CONFIRM_STYLES: Record<Variant, string> = {
  danger:  'bg-danger  hover:bg-red-600',
  warning: 'bg-warning hover:bg-amber-500',
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // ESC closes; only active while open.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const icon = ICON_STYLES[variant];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={
          'bg-surface dark:bg-surface-dark ' +
          'rounded-2xl border border-border dark:border-border-dark ' +
          'p-6 w-full max-w-sm shadow-xl'
        }
        // Stop overlay click from bubbling through if a parent ever listens.
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${icon.bg}`}>
          <AlertTriangle size={20} className={icon.fg} aria-hidden="true" />
        </div>

        <h2
          id={titleId}
          className="mt-4 text-base font-semibold text-text-primary dark:text-text-dark-primary"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            autoFocus
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={
              'flex-1 border border-border-strong dark:border-border-dark-strong ' +
              'rounded-lg py-2.5 text-sm text-text-secondary dark:text-text-dark-secondary ' +
              'hover:bg-surface-muted dark:hover:bg-border-dark ' +
              'transition-colors duration-200 ' +
              'disabled:opacity-50 disabled:cursor-not-allowed ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            }
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={
              `flex-1 rounded-lg py-2.5 text-sm text-white font-medium ${CONFIRM_STYLES[variant]} ` +
              'active:scale-[0.98] transition-all duration-200 ' +
              'disabled:opacity-50 disabled:cursor-not-allowed ' +
              'flex items-center justify-center gap-2 ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
            }
          >
            {isLoading && <LoadingSpinner size="sm" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
