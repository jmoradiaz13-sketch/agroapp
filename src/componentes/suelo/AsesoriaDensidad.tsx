import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  interpretarDensidad, interpretarPorosidad, calcularPorosidad, DENSIDAD_REAL_SUPUESTA,
  FUENTE_DENSIDAD, FUENTE_POROSIDAD, type ClaseTextural,
} from '../../datos/fisicas';
import { textoEstadoDensidad, FUENTES_DENSIDAD_METODO } from '../../datos/densidad';
import { SemaforoDensidad } from './fisicas_apoyo';

// Panel de asesoría de densidad: estado frente a la clase textural, porosidad
// derivada y manejo sugerido. Interpretación NRCS por clase textural.
export function AsesoriaDensidad({ valores, claseTextural }: {
  valores: Partial<FichaSueloFormulario>;
  claseTextural: ClaseTextural | null;
}) {
  const da = valores.densidadAparente;
  const dr = valores.densidadReal ?? DENSIDAD_REAL_SUPUESTA;
  const poroDerivada = da !== undefined ? calcularPorosidad(da, dr) : null;
  const poro = valores.porosidadPct ?? poroDerivada;
  const estado = da !== undefined && claseTextural ? interpretarDensidad(da, claseTextural) : null;

  return (
    <div className="grid gap-2.5">
      <div className="border border-neutral-200 bg-white p-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Densidad aparente registrada</p>
        {da !== undefined ? (
          <>
            <p className="text-sm font-semibold text-neutral-800">{da} g/cm³</p>
            {estado && claseTextural ? (
              <div className="mt-1 grid gap-1">
                <SemaforoDensidad da={da} clase={claseTextural} />
                <p className="text-xs text-neutral-600">{textoEstadoDensidad(estado)}</p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">Sin clase textural no hay umbral de referencia: regístrala para interpretar.</p>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">Sin registrar</p>
        )}
      </div>

      {poro !== null && (
        <div className="border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Porosidad total</p>
          <p className="text-sm text-neutral-700">
            {poro} % ({interpretarPorosidad(poro)})
            {valores.porosidadPct === undefined && <span className="text-neutral-500"> · derivada con DR = {dr} g/cm³</span>}
          </p>
        </div>
      )}

      <details className="text-xs text-neutral-500">
        <summary className="cursor-pointer font-medium text-emerald-700">Fuentes de la asesoría</summary>
        <ul className="mt-1 grid gap-0.5">
          <li>· {FUENTE_DENSIDAD}</li>
          <li>· {FUENTE_POROSIDAD}</li>
          {FUENTES_DENSIDAD_METODO.slice(1, 3).map((f) => <li key={f}>· {f}</li>)}
        </ul>
      </details>
    </div>
  );
}
