import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import type { InterpretacionNdvi, PuntoNdvi } from '../../servicios/sig';

// Tarjeta de serie temporal NDVI: gráfica con umbrales 0,3/0,6,
// lectura por fecha y alerta de zona débil (patrón OneSoil).
export function TarjetaSerieNdvi({
  serie, interp, cargando, alActualizar,
}: {
  serie: PuntoNdvi[] | null;
  interp: InterpretacionNdvi | null;
  cargando: boolean;
  alActualizar: () => void;
}) {
  return (
    <Tarjeta titulo="Serie temporal NDVI">
      <Boton onClick={alActualizar} disabled={cargando}>
        {cargando ? 'Leyendo serie…' : ' Actualizar serie'}
      </Boton>
      {!serie ? (
        <p className="mensaje-info">Sin serie en este dispositivo. Actualiza con red o usa la precarga de oficina.</p>
      ) : (
        <>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={serie.map((p) => ({ ...p, dia: p.fecha.slice(5) }))}>
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis domain={[0, 1]} fontSize={11} />
                <Tooltip />
                <ReferenceLine y={0.3} stroke="#dc2626" strokeDasharray="4 3" />
                <ReferenceLine y={0.6} stroke="#f59e0b" strokeDasharray="4 3" />
                <Line type="monotone" dataKey="ndvi" stroke="#14736E" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <dl className="grid gap-1 text-sm">
            {serie.map((p) => (
              <div key={p.fecha} className="flex items-center justify-between gap-2 border-b border-neutral-100 py-1">
                <dt className="text-neutral-500">{p.fecha}</dt>
                <dd className="font-semibold">{p.ndvi} · <span className="font-medium capitalize">{p.clase}</span></dd>
              </div>
            ))}
          </dl>
          {interp && (
            <p className={interp.alerta ? 'mensaje-error' : 'mensaje-ok'}>
              Tendencia {interp.tendencia} (Δ {interp.delta}). {interp.alerta ?? 'Sin zonas críticas.'}
            </p>
          )}
        </>
      )}
    </Tarjeta>
  );
}
