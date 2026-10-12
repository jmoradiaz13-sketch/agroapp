import { Tarjeta } from '../ui/Tarjeta';
import { Boton, BotonSecundario } from '../ui/Boton';
import type { Costo, Escenario } from '../../servicios/simulador';

// Comparador A/B/C: usos, RUSLE antes→después, cobertura año 5,
// conservación y costo 5 años. El técnico elige y guarda offline.
export function Comparador({
  escenarios, elegido, alElegir, alGuardar, costos = {},
}: {
  escenarios: Escenario[];
  elegido: 'A' | 'B' | 'C';
  alElegir: (t: 'A' | 'B' | 'C') => void;
  alGuardar: (e: Escenario) => void;
  costos?: Record<string, Costo>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3 items-start">
      {escenarios.map((e) => (
        <Tarjeta
          key={e.tipo}
          titulo={e.nombre}
          className={elegido === e.tipo ? '!border-emerald-500 !border-2' : ''}
        >
          <div className="h-3 w-full flex overflow-hidden rounded-sm border border-neutral-200" aria-hidden>
            {Object.entries(e.usos).map(([uso, v]) => (
              v > 0 ? (
                <span
                  key={uso}
                    style={{ width: `${v}%`, background: uso.includes('Conserv') || uso.includes('Corredor') ? '#555555' : uso.includes('SAF') ? '#2d6a4f' : '#14736E' }}
                  title={`${uso} ${v} %`}
                />
              ) : null
            ))}
          </div>
          <dl className="grid gap-1 text-sm">
            <div className="flex justify-between border-b border-neutral-100 py-1">
              <dt className="text-neutral-500">RUSLE</dt>
              <dd className="font-semibold">{e.rusle_antes_t_ha_ano} → {e.rusle_despues_t_ha_ano} t/ha/año</dd>
            </div>
            <div className="flex justify-between border-b border-neutral-100 py-1">
              <dt className="text-neutral-500">Cobertura año 5</dt>
              <dd className="font-semibold">{e.proyeccion_cobertura[e.proyeccion_cobertura.length - 1]?.cobertura_pct} %</dd>
            </div>
            <div className="flex justify-between border-b border-neutral-100 py-1">
              <dt className="text-neutral-500">Conservación</dt>
              <dd className="font-semibold">{e.conservacion_pct} %</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-neutral-500">Especies aptas</dt>
              <dd className="font-semibold">{e.especies_aptas}</dd>
            </div>
            {costos[e.tipo] && (
              <>
                <div className="flex justify-between border-b border-neutral-100 py-1">
                  <dt className="text-neutral-500">Costo 5 años</dt>
                  <dd className="font-semibold">${costos[e.tipo].total_cop.toLocaleString('es-CO')}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-neutral-500">Costo/ha</dt>
                  <dd className="font-semibold">${costos[e.tipo].costo_ha_cop.toLocaleString('es-CO')}</dd>
                </div>
              </>
            )}
          </dl>
          <p className="text-xs text-neutral-600">{e.componentes.join(' · ') || 'Sin componentes'}</p>
          <p className="text-[11px] italic text-neutral-500">Fuente: {e.fuente}</p>
          <div className="flex gap-2 flex-wrap">
            <BotonSecundario onClick={() => alElegir(e.tipo)}>
              {elegido === e.tipo ? '✓ Elegido' : 'Elegir'}
            </BotonSecundario>
            <Boton onClick={() => alGuardar(e)}>Guardar offline</Boton>
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}
