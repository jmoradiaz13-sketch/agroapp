import type { Madurez } from '../servicios/madurez';

const COLOR_NIVEL: Record<string, string> = {
  Bronce: '#CA763B',
  Plata: '#80917D',
  Oro: '#EEA83B',
  Diamante: '#10b981',
};

// Indicador radial táctil del progreso de planificación predial (AGENTS.md §5).
// Anillo SVG sin dependencias, legible al sol y en una sola mano.
export function MedidorRadial({ madurez }: { madurez: Madurez }) {
  const radio = 52;
  const perimetro = 2 * Math.PI * radio;
  const avance = (madurez.progresoPct / 100) * perimetro;
  const color = COLOR_NIVEL[madurez.nivel] ?? '#10b981';

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-32 h-32 shrink-0" role="progressbar" aria-valuenow={madurez.progresoPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Madurez predial ${madurez.nivel}`}>
        <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
          <circle cx="64" cy="64" r={radio} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
          <circle
            cx="64" cy="64" r={radio} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${avance} ${perimetro}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center content-center text-center">
          <span className="numeros text-lg font-bold text-white leading-none">{madurez.nivel}</span>
          <span className="numeros text-[11px] text-white/60">{madurez.puntos} pts</span>
        </div>
      </div>
      <div className="grid gap-1.5 content-center min-w-0">
        <p className="text-sm font-semibold text-white">Madurez predial · {madurez.nivel}</p>
        <p className="text-xs text-white/60">
          {madurez.siguiente
            ? `${madurez.puntosParaSiguiente} pts para ${madurez.siguiente} (${madurez.progresoPct} %)`
            : 'Nivel máximo alcanzado'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {madurez.insignias.map((i) => (
            <span
              key={i.id}
              title={i.detalle}
              className={`text-[10px] font-bold tracking-wide rounded-full px-2.5 py-1 border ${
                i.obtenida
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-white/5 border-white/15 text-white/40'
              }`}
            >
              {i.obtenida ? '★' : '☆'} {i.titulo}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
