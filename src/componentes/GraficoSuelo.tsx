import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { Hallazgo } from '../esquemas/diagnostico';

// MVP 6: visualización gráfica por indicador (Recharts), detalle bajo demanda.
export function GraficoSuelo({ hallazgos }: { hallazgos: Hallazgo[] }) {
  if (hallazgos.length === 0) return <p className="mensaje-info">Sin datos para graficar. Crea una ficha o siembra la demo.</p>;
  const datos = hallazgos.map((h) => ({
    parametro: h.parametro.replace('_pct', '').replace('_mg_kg', '').slice(0, 10),
    valor: h.valor,
    estado: h.estado
  }));
  return (
    <section className="bg-white border border-neutral-200 p-5 grid gap-4">
      <div className="border-b border-neutral-200 pb-3">
        <h2 className="text-lg font-semibold text-[#141414]">Estado del suelo (gráfico)</h2>
        <p className="text-xs text-neutral-500">Valores por parámetro de la última ficha diagnosticada</p>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={datos}>
            <XAxis dataKey="parametro" fontSize={10} interval={0} angle={-20} height={50} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="valor" fill="#1b5e20" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <RadarChart data={datos}>
            <PolarGrid />
            <PolarAngleAxis dataKey="parametro" fontSize={10} />
            <Radar dataKey="valor" fill="#1b5e20" stroke="#1b5e20" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
