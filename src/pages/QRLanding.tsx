import { useState, useEffect } from 'react';
import { QrCode, Shield, Loader2 } from 'lucide-react';

interface Props {
  productUuid: string;
  onRedirect: () => void;
}

export default function QRLanding({ productUuid, onRedirect }: Props) {
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalMs = 3000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalMs) * 100, 100);
      setProgress(pct);
      setCountdown(Math.max(0, Math.ceil((totalMs - elapsed) / 1000)));

      if (elapsed >= totalMs) {
        clearInterval(interval);
        onRedirect();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onRedirect]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
          <QrCode className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-900 mb-1">Verificando producto</h1>
        <p className="text-sm text-slate-500 mb-8">Redirigiendo al Product Passport...</p>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Countdown */}
        <p className="text-4xl font-bold text-amber-600 mb-2">{countdown}</p>
        <p className="text-xs text-slate-400">segundos</p>

        {/* Skip button */}
        <button
          onClick={onRedirect}
          className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
        >
          Ir directo al passport
        </button>

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <Shield className="w-4 h-4 text-slate-300" />
          <span className="text-xs text-slate-300 font-medium">SGRT Product Passport</span>
        </div>
      </div>
    </div>
  );
}
