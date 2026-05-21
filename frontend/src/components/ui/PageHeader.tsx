import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6 gap-4">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-text-primary dark:text-text-dark-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-muted dark:text-text-dark-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
