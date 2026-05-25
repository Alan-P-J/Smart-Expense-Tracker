import { Plus } from 'lucide-react';

interface AddBudgetCardProps {
  onAdd: () => void;
}

export function AddBudgetCard({ onAdd }: AddBudgetCardProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={
        'fade-up rounded-2xl border-2 border-dashed border-border-strong dark:border-[#2D3956] ' +
        'hover:border-accent/50 bg-white/40 dark:bg-[#1A233A]/40 hover:bg-white dark:hover:bg-[#1A233A] ' +
        'transition flex flex-col items-center justify-center min-h-[300px] ' +
        'text-text-muted dark:text-[#94A3B8] hover:text-accent group ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      }
    >
      <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <Plus size={22} aria-hidden="true" />
      </div>
      <div className="text-[14px] font-semibold">Create new budget</div>
      <p className="text-[12px] text-text-muted dark:text-[#94A3B8] mt-1">Set a spending limit per category</p>
    </button>
  );
}
