import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { Hallazgo } from '../esquemas/diagnostico';

// MVP 6: visualización gráfica por indicador (Recharts), detalle bajo demanda.
// `oscuro` lo viste de tablero nocturno (dashboard); por defecto tarjeta clara.
export function GraficoSuelo({ hallazgos, oscuro = false }: { hallazgos: Hallazgo[]; oscuro?: boolean }) {
  if (hallazgos.length === 0) return <p className="mensaje-info">Sin datos para graficar. Crea una ficha o siembra la demo.</p>;
  const datos = hallazgos.map((h) => ({
    parametro: h.parametro.replace('_pct', '').replace('_mg_kg', '').slice(0, 10),
    valor: h.valor,
    estado: h.estado
  }));
  return (
    <section className={oscuro ? 'glass rounded-2xl p-5 grid gap-4' : 'bg-white border border-neutral-200 p-5 grid gap-4'}>
      <div className={oscuro ? 'border-b border-white/10 pb-3' : 'border-b border-neutral-200 pb-3'}>
        <h2 className={oscuro ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-humus'}>Estado del suelo (gráfico)</h2>
        <p className={oscuro ? 'text-xs text-white/55' : 'text-xs text-neutral-500'}>Valores por parámetro de la última ficha diagnosticada</p>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={datos}>
            <XAxis dataKey="parametro" fontSize={10} interval={0} angle={-20} height={50} stroke={oscuro ? '#94a3b8' : undefined} />
            <YAxis stroke={oscuro ? '#94a3b8' : undefined} fontSize={11} />
            <Tooltip contentStyle={oscuro ? { background: '#0f172a', border: '1px solid rgba(110,231,183,0.3)', color: '#fff' } : undefined} />
            <Bar dataKey="valor" fill="#059669" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <RadarChart data={datos}>
            <PolarGrid stroke={oscuro ? 'rgba(255,255,255,0.15)' : undefined} />
            <PolarAngleAxis dataKey="parametro" fontSize={10} tick={{ fill: oscuro ? '#cbd5e1' : '#404040' }} />
            <Radar dataKey="valor" fill="#CA763B" stroke="#8a4d1c" fillOpacity={0.45} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
