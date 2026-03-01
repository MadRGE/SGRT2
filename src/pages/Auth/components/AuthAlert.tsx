import { AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  type: 'error' | 'success';
  message: string;
}

const styles = {
  error: {
    container: 'bg-red-50 border-red-100',
    icon: 'text-red-500',
    text: 'text-red-600',
    Icon: AlertCircle,
  },
  success: {
    container: 'bg-emerald-50 border-emerald-100',
    icon: 'text-emerald-500',
    text: 'text-emerald-600',
    Icon: CheckCircle,
  },
};

export default function AuthAlert({ type, message }: Props) {
  const s = styles[type];
  return (
    <div className={`mb-5 p-3 border rounded-xl flex items-start gap-2.5 ${s.container}`}>
      <s.Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.icon}`} />
      <p className={`text-[13px] ${s.text}`}>{message}</p>
    </div>
  );
}
