interface CategoryChipProps {
  name: string;
  color: string; // hex
}

export function CategoryChip({ name, color }: CategoryChipProps) {
  return (
    <span
      className="inline-flex items-center h-[24px] px-2.5 rounded-md text-[11.5px] font-semibold"
      style={{ color, background: color + '22' }}
    >
      {name}
    </span>
  );
}
