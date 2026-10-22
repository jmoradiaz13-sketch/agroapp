import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { NIVELES_VESS } from '../../datos/fisicas';
import { textoEstadoEstructura, FUENTES_ESTRUCTURA } from '../../datos/estructura_vess';

const COLOR_SQ = (sq: number) =>
  sq <= 2 ? 'bg-emerald-600 text-white' : sq === 3 ? 'bg-amber-500 text-white' : 'bg-red-600 text-white';

// Asesoría VESS: puntaje, lectura rápida y contexto de campo registrado.
export function AsesoriaEstructura({ valores }: { valores: Partial<FichaSueloFormulario> }) {
  const sq = valores.estructuraVess;
  const nivel = NIVELES_VESS.find((n) => n.sq === sq);
  const compactacion = valores.compactacion;
  const infiltracion = valores.infiltracion;
  const profundidad = valores.profundidadEfectivaCm;

  return (
    <div className="grid gap-2.5">
      <div className="border border-neutral-200 bg-white p-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Estructura registrada</p>
        {sq !== undefined && nivel ? (
          <>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex h-7 w-9 items-center justify-center rounded-sm text-sm font-semibold ${COLOR_SQ(sq)}`}>Sq{sq}</span>
              <span className="text-sm font-medium text-neutral-800">{nivel.titulo.split('·')[1]?.trim()}</span>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden>
              {NIVELES_VESS.map((n) => (
                <span key={n.sq} className={`h-1.5 flex-1 rounded-full ${n.sq === sq ? COLOR_SQ(sq) : 'bg-neutral-200'}`} />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-neutral-600">{nivel.descripcion}</p>
            <p className={`mt-1 text-xs font-medium ${sq <= 2 ? 'text-emerald-700' : sq === 3 ? 'text-amber-600' : 'text-red-700'}`}>
              {textoEstadoEstructura(sq)}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">Sin registrar</p>
        )}
      </div>

      {(compactacion !== undefined || infiltracion !== undefined || profundidad !== undefined) && (
        <div className="border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Contexto de campo</p>
          <dl className="mt-1 grid gap-0.5 text-xs text-neutral-600">
            {compactacion !== undefined && <div className="flex gap-2"><dt className="w-24 shrink-0 text-neutral-500">Compactación</dt><dd className="font-medium text-neutral-700">{compactacion}</dd></div>}
            {infiltracion !== undefined && <div className="flex gap-2"><dt className="w-24 shrink-0 text-neutral-500">Infiltración</dt><dd className="font-medium text-neutral-700">{infiltracion}</dd></div>}
            {profundidad !== undefined && <div className="flex gap-2"><dt className="w-24 shrink-0 text-neutral-500">Prof. efectiva</dt><dd className="font-medium text-neutral-700">{profundidad} cm</dd></div>}
          </dl>
        </div>
      )}

      <details className="text-xs text-neutral-500">
        <summary className="cursor-pointer font-medium text-emerald-700">Fuentes de la asesoría</summary>
        <ul className="mt-1 grid gap-0.5">
          {FUENTES_ESTRUCTURA.map((f) => <li key={f}>· {f}</li>)}
        </ul>
      </details>
    </div>
  );
}
