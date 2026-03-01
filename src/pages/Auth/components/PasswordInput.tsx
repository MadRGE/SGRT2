import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  rightLabel?: React.ReactNode;
  hint?: string;
}

export default function PasswordInput({ label, value, onChange, required, disabled, placeholder = '••••••••', rightLabel, hint }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[13px] font-semibold text-slate-700">{label}</label>
        {rightLabel}
      </div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
