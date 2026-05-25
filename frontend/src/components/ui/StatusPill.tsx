type Status = 'Approved' | 'Pending' | 'Rejected';

const STYLES: Record<Status, { fg: string; bg: string }> = {
  Approved: { fg: '#10B981', bg: 'rgba(16, 185, 129, 0.13)' },
  Pending:  { fg: '#F59E0B', bg: 'rgba(245, 158, 11, 0.13)' },
  Rejected: { fg: '#EF4444', bg: 'rgba(239, 68, 68, 0.13)' },
};

export function StatusPill({ status }: { status: Status | string }) {
  const s = (STYLES as Record<string, { fg: string; bg: string }>)[status] ?? {
    fg: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.13)',
  };
  return (
    <span
      className="inline-flex items-center h-[24px] px-2.5 rounded-full text-[11.5px] font-semibold tracking-wide"
      style={{ color: s.fg, background: s.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: s.fg }} />
      {status}
    </span>
  );
}
