interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_PX: Record<NonNullable<LoadingSpinnerProps['size']>, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

export function LoadingSpinner({ size = 'md', label, className = '' }: LoadingSpinnerProps) {
  const px = SIZE_PX[size];
  return (
    <span
      role="status"
      aria-live="polite"
      className={'inline-flex items-center justify-center ' + className}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin text-primary"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label ?? 'Loading...'}</span>
    </span>
  );
}
