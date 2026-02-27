import { CARGA_ESTADOS, CARGA_ESTADO_LABELS } from '../../lib/constants/despacho';

interface Props {
  estado: string;
}

export default function CargaTimeline({ estado }: Props) {
  const currentIndex = CARGA_ESTADOS.indexOf(estado as typeof CARGA_ESTADOS[number]);

  return (
    <div className="flex items-center gap-1 w-full">
      {CARGA_ESTADOS.map((step, i) => {
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              {/* Dot */}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
                isCurrent
                  ? 'bg-amber-500 ring-4 ring-amber-100'
                  : isActive
                    ? 'bg-emerald-500'
                    : 'bg-slate-200'
              }`} />
              {/* Label */}
              <span className={`text-[9px] mt-1 text-center leading-tight ${
                isCurrent ? 'text-amber-700 font-semibold' : isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {CARGA_ESTADO_LABELS[step]}
              </span>
            </div>
            {/* Connector line */}
            {i < CARGA_ESTADOS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-0.5 mt-[-12px] ${
                i < currentIndex ? 'bg-emerald-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
