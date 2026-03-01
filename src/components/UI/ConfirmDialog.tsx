import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: AlertTriangle,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
};

export default function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <button onClick={onCancel} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg">
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 ${style.iconBg} rounded-full flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${style.iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors focus:outline-none focus:ring-2 ${style.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hook for promise-based confirm dialogs. Returns { confirm, dialogProps }. */
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    title?: string;
    variant?: 'danger' | 'warning' | 'info';
    resolve?: (v: boolean) => void;
  }>({ open: false, message: '' });

  const confirm = (opts: { message: string; title?: string; variant?: 'danger' | 'warning' | 'info' }): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, ...opts, resolve });
    });
  };

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ open: false, message: '' });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ open: false, message: '' });
  };

  return {
    confirm,
    dialogProps: {
      open: state.open,
      message: state.message,
      title: state.title,
      variant: state.variant,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
