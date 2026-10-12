import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { Hallazgo } from '../esquemas/diagnostico';
import { normalizarParaRadar, colorEstado } from '../servicios/diagnostico';

// Premium: radar normalizado 0-100 (no mezcla % con mg/kg) + barras con semáforo.
// Superficie del tema en ambos modos (`oscuro` se conserva por compatibilidad).
export function GraficoSuelo({ hallazgos, oscuro = true }: { hallazgos: Hallazgo[]; oscuro?: boolean }) {
  void oscuro;
  if (hallazgos.length === 0) return <p className="mensaje-info">Sin datos para graficar. Crea una ficha o siembra la demo.</p>;
  const datos = normalizarParaRadar(hallazgos);
  const barras = hallazgos.map((h) => ({
    parametro: h.parametro.replace('_pct', '').replace('_mg_kg', '').replace('_cmol_kg', '').replace('_ds_m', '').slice(0, 10),
    valor: h.valor,
    unidad: h.unidad,
    color: colorEstado(h.estado),
  }));
  return (
    <section className="glass rounded-2xl p-5 grid gap-4">
      <div className="pb-3" style={{ borderBottom: '1px solid var(--borde)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--texto)' }}>Estado del suelo (0-100 normalizado)</h2>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Radar comparable por parámetro · 90 óptimo, 50 exceso, 40 deficiente</p>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={barras}>
            <XAxis dataKey="parametro" fontSize={10} interval={0} angle={-20} height={50} stroke="#8A7A63" />
            <YAxis stroke="#8A7A63" fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--sup)', border: '1px solid var(--borde)', color: 'var(--texto)', borderRadius: 0 }} />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
              {barras.map((b) => <Cell key={b.parametro} fill={b.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer>
          <RadarChart data={datos}>
            <PolarGrid stroke="#8A7A63" strokeOpacity={0.35} />
            <PolarAngleAxis dataKey="parametro" fontSize={11} tick={{ fill: '#8A7A63' }} />
            <Radar dataKey="puntaje" fill="#14736E" stroke="#14736E" fillOpacity={0.35} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
