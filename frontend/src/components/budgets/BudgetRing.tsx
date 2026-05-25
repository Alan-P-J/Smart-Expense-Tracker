interface BudgetRingProps {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
}

export function BudgetRing({ pct, color, size = 96, stroke = 8 }: BudgetRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const visible = Math.min(Math.max(pct, 0), 100);
  const offset = c - (visible / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(148,163,184,0.12)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[20px] font-bold text-text-primary dark:text-[#F5F7FF] tnum tracking-tight">
          {Math.round(pct)}%
        </div>
        <div className="text-[10.5px] text-text-muted dark:text-[#94A3B8] uppercase tracking-wider">used</div>
      </div>
    </div>
  );
}
