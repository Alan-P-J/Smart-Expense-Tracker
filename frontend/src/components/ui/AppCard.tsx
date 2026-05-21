import { type HTMLAttributes, type PropsWithChildren } from 'react';

interface AppCardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function AppCard({ children, className = '', ...rest }: AppCardProps) {
  return (
    <div
      className={
        'rounded-xl border border-gray-100 dark:border-gray-800 ' +
        'bg-white dark:bg-gray-900 p-5 transition-colors duration-200 ' +
        className
      }
      {...rest}
    >
      {children}
    </div>
  );
}
