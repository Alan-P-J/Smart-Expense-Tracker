interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ' + className
      }
      aria-hidden="true"
    />
  );
}
