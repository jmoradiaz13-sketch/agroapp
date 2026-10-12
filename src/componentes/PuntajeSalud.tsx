import { GaugeArco } from './GaugeArco';
import type { PuntajeSalud as TipoPuntaje } from '../esquemas/diagnostico';

// Gauge premium 0-100 con semáforo, conteo y cita trazable.
const COLOR_NIVEL: Record<TipoPuntaje['nivel'], string> = {
  bueno: '#14736E',
  moderado: '#f59e0b',
  pobre: '#dc2626',
  'sin-datos': '#94a3b8',
};

const ETIQUETA_NIVEL: Record<TipoPuntaje['nivel'], string> = {
  bueno: 'Bueno · suelo sano',
  moderado: 'Moderado',
  pobre: 'Pobre · intervenir',
  'sin-datos': 'Sin datos',
};

export function PuntajeSalud({ puntaje, fechaCache }: { puntaje: TipoPuntaje; fechaCache?: string }) {
  const color = COLOR_NIVEL[puntaje.nivel];
  return (
    <section className="glass rounded-2xl p-5 grid gap-4 animacion-entrada" aria-label="Puntaje de salud del suelo">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--texto)' }}>Salud del suelo · {puntaje.puntaje}/100</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {puntaje.n_optimo}/{puntaje.n_total} parámetros en óptimo · {ETIQUETA_NIVEL[puntaje.nivel]}
          </p>
        </div>
        <span
          className="text-[11px] font-bold tracking-wide rounded-full px-3 py-1.5 border"
          style={{ color, borderColor: `${color}80`, background: `${color}1a` }}
        >
          ● {ETIQUETA_NIVEL[puntaje.nivel]}
        </span>
      </div>
      <div className="grid sm:grid-cols-[220px_1fr] gap-4 items-center">
        <GaugeArco valor={puntaje.puntaje} titulo="Soil Health Score" subtexto={`${puntaje.n_optimo}/${puntaje.n_total} en óptimo`} color={color} gradiente />
        <div className="grid gap-2 content-start">
          <p className="text-sm" style={{ color: 'var(--texto)' }}>{puntaje.detalle}</p>
          <p className="text-[11px] italic" style={{ color: 'var(--faint)' }}>Fuente: {puntaje.fuente} · El sistema sugiere, el técnico decide.</p>
          {fechaCache && <p className="text-[11px]" style={{ color: 'var(--faint)' }}>Caché local - actualizado el {fechaCache}</p>}
          <div className="flex gap-1.5 h-2.5 rounded-full overflow-hidden" aria-hidden>
            <span className="flex-1 bg-red-600/80" title="Pobre <60" />
            <span className="flex-1 bg-amber-500/80" title="Moderado 60-79" />
            <span className="flex-1 bg-[#14736E]/80" title="Bueno ≥80" />
          </div>
          <p className="text-[11px]" style={{ color: 'var(--faint)' }}>Pobre &lt;60 · Moderado 60-79 · Bueno ≥80</p>
        </div>
      </div>
    </section>
  );
}
