interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={
        'animate-pulse bg-surface-muted dark:bg-border-dark-strong rounded-lg ' + className
      }
      aria-hidden="true"
    />
  );
}
