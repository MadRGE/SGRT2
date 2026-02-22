interface Props {
  label: string;
  colorClass: string;
  fallbackClass?: string;
  className?: string;
}

export default function StatusBadge({
  label,
  colorClass,
  fallbackClass = 'bg-slate-100 text-slate-600',
  className = '',
}: Props) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${colorClass || fallbackClass} ${className}`}
    >
      {label}
    </span>
  );
}
