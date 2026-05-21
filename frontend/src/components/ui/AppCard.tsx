import { type HTMLAttributes, type PropsWithChildren } from 'react';

interface AppCardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function AppCard({ children, className = '', ...rest }: AppCardProps) {
  return (
    <div
      className={
        'rounded-xl border border-border dark:border-border-dark ' +
        'bg-surface dark:bg-surface-dark p-5 transition-colors duration-200 ' +
        className
      }
      {...rest}
    >
      {children}
    </div>
  );
}
