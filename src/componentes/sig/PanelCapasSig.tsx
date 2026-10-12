import { CAPAS_SIG, type CapaSig } from '../../datos/sig';

function colorInsignia(i: CapaSig['insignia']) {
  return i === 'OFFLINE'
    ? 'text-[#7FC4BB]'
    : i === 'MIXTO'
      ? 'text-amber-300'
      : 'text-sky-300';
}

// Lista de capas estilo OneSoil/QField: toggle grande, insignia de
// conectividad, fuente oficial y peso estimado para el caché de 200 MB.
// `guardadas` indica fecha de la copia offline en Dexie por id de capa.
export function PanelCapasSig({
  activas,
  alCambiar,
  guardadas = {},
}: {
  activas: string[];
  alCambiar: (id: string) => void;
  guardadas?: Record<string, string>;
}) {
  return (
    <div className="grid gap-2" role="group" aria-label="Capas SIG disponibles">
      {CAPAS_SIG.map((c) => {
        const encendida = activas.includes(c.id);
        const fecha = guardadas[c.id];
        return (
          <article
            key={c.id}
            className={`border rounded-sm p-3 grid gap-1.5 transition-colors ${
              encendida ? 'border-[#059669] bg-green-50/60' : 'border-neutral-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid gap-0.5 min-w-0">
                <h3 className="text-sm font-semibold text-humus flex items-center gap-2 flex-wrap">
                  {c.titulo}
                  <span className={`text-[10px] font-bold tracking-widest ${colorInsignia(c.insignia)} bg-selva rounded-sm px-1.5 py-0.5`}>
                    {c.insignia}
                  </span>
                  {!c.disponible && (
                    <span className="text-[10px] font-bold tracking-widest bg-neutral-200 text-neutral-600 rounded-sm px-1.5 py-0.5">
                      PRÓXIMO
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{c.descripcion}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={encendida}
                aria-label={`Mostrar capa ${c.titulo}`}
                disabled={!c.disponible}
                onClick={() => alCambiar(c.id)}
                className={`boton-campo shrink-0 w-12 h-8 p-1 transition-colors disabled:opacity-40 ${
                  encendida ? '' : 'bg-neutral-300'
                }`}
                style={encendida ? { background: '#14736E' } : undefined}
              >
                <span
                  className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    encendida ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-neutral-500">
              Fuente: {c.fuente} · {c.pesoEstimado}
              {fecha ? (
                <span className="ml-1 font-semibold text-emerald-700">· Guardada ✓ {fecha}</span>
              ) : (
                c.disponible && <span className="ml-1">· Sin copia offline</span>
              )}
            </p>
          </article>
        );
      })}
    </div>
  );
}
