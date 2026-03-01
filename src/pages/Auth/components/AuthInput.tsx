interface Props {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
}

export default function AuthInput({ label, type = 'text', required, value, onChange, disabled, placeholder, hint }: Props) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        placeholder={placeholder}
        disabled={disabled}
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
