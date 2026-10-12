import { useId } from 'react';

// Gauge de semicírculo (ref_2): VSA, pH con gradiente y MO.
// SVG puro, alto contraste al sol, sin dependencias.
export function GaugeArco({
  valor,
  minimo = 0,
  maximo = 100,
  titulo,
  subtexto,
  color = '#14736E',
  gradiente = false,
}: {
  valor: number | undefined;
  minimo?: number;
  maximo?: number;
  titulo: string;
  subtexto: string;
  color?: string;
  gradiente?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const radio = 52;
  const perimetro = Math.PI * radio;
  const fraccion = valor === undefined ? 0 : Math.max(0, Math.min(1, (valor - minimo) / (maximo - minimo)));
  const avance = fraccion * perimetro;

  return (
    <div className="grid gap-1 content-start text-center" role="img" aria-label={`${titulo}: ${valor ?? 'sin dato'} ${subtexto}`}>
      <svg viewBox="0 0 128 76" className="w-full max-w-[190px] mx-auto">
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#14736E" />
          </linearGradient>
        </defs>
        <path d="M 12 68 A 52 52 0 0 1 116 68" fill="none" style={{ stroke: 'var(--borde)' }} strokeWidth="12" strokeLinecap="round" />
        <path
          d="M 12 68 A 52 52 0 0 1 116 68" fill="none"
          stroke={gradiente ? `url(#g-${id})` : color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${avance} ${perimetro}`} className="transition-all duration-700"
        />
        <text x="64" y="58" textAnchor="middle" fontSize="22" fontWeight="700" style={{ fill: 'var(--texto)' }}>
          {valor ?? '—'}
        </text>
      </svg>
      <p className="text-xs font-bold tracking-wide" style={{ color: 'var(--texto)' }}>{titulo}</p>
      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{subtexto}</p>
    </div>
  );
}
