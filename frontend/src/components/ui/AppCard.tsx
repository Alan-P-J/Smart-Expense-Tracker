import { type HTMLAttributes, type PropsWithChildren } from 'react';

interface AppCardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  className?: string;
  /** Padding preset — default is comfortable (p-6); pass `tight` for nested cards. */
  padding?: 'comfortable' | 'tight' | 'none';
}

const PADDING = {
  comfortable: 'p-6',
  tight: 'p-4',
  none: '',
} as const;

export function AppCard({
  children,
  className = '',
  padding = 'comfortable',
  ...rest
}: AppCardProps) {
  return (
    <div
      className={
        'rounded-card border border-border dark:border-[#1F2A44] ' +
        'bg-surface dark:bg-[#1A233A] ' +
        'shadow-card dark:shadow-card-dark ' +
        'transition-colors duration-200 ' +
        PADDING[padding] + ' ' +
        className
      }
      {...rest}
    >
      {children}
    </div>
  );
}
