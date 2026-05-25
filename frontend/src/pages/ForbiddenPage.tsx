import { useNavigate } from 'react-router-dom';

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-muted dark:bg-[#081028] text-center px-4 transition-colors duration-200">
      {/* Decorative "403" — not a heading */}
      <p className="text-6xl md:text-8xl font-bold text-primary opacity-20 select-none">403</p>

      <h1 className="text-2xl font-semibold text-text-primary dark:text-[#F5F7FF] mt-4">
        Access Denied
      </h1>
      <p className="text-text-muted dark:text-[#94A3B8] mt-2 max-w-md">
        You don&apos;t have permission to view this page. Contact your administrator if you
        believe this is a mistake.
      </p>

      <button
        type="button"
        onClick={() => navigate('/dashboard', { replace: true })}
        className={
          'mt-6 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white ' +
          'font-medium transition-all duration-200 ' +
          'active:scale-[0.98] ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        }
      >
        Go to Dashboard
      </button>
    </div>
  );
}
