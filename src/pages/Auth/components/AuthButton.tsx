import { Loader2 } from 'lucide-react';

interface Props {
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function AuthButton({ loading, children, disabled }: Props) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}
