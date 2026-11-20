import { CAPAS_SIG, type CapaSig } from '../../datos/sig';

function colorInsignia(i: CapaSig['insignia']) {
  return i === 'OFFLINE'
    ? 'text-[#7FC4BB]'
    : i === 'MIXTO'
      ? 'text-amber-300'
      : 'text-sky-300';
}

// Capas que realmente se dibujan sobre el mapa. Los análisis (DEM, RUSLE,
// NDVI, UPRA) viven en el inspector y no se presentan como capas activas.
export function PanelCapasSig({
  activas,
  alCambiar,
  guardadas = {},
}: {
  activas: string[];
  alCambiar: (id: string) => void;
  guardadas?: Record<string, string>;
}) {
  const capas = CAPAS_SIG.filter((c) => c.tipo === 'mapa');
  return (
    <div className="grid gap-2" role="group" aria-label="Capas SIG disponibles">
      {capas.map((c) => {
        const encendida = activas.includes(c.id);
        const fecha = guardadas[c.id];
        return (
          <article
            key={c.id}
            className={`border p-3 grid gap-1.5 transition-colors ${
              encendida ? 'border-[var(--acento)] bg-[var(--acento-suave)]' : 'border-[var(--borde)] bg-[var(--sup)]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid gap-0.5 min-w-0">
                <h3 className="text-sm font-semibold flex items-center gap-2 flex-wrap" style={{ color: 'var(--texto)' }}>
                  {c.titulo}
                  <span className={`text-[10px] font-bold tracking-widest ${colorInsignia(c.insignia)} bg-selva px-1.5 py-0.5`}>
                    {c.insignia}
                  </span>
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{c.descripcion}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={encendida}
                aria-label={`Mostrar capa ${c.titulo}`}
                onClick={() => alCambiar(c.id)}
                className="boton-campo shrink-0 w-12 h-8 p-1 transition-colors"
                style={{ background: encendida ? 'var(--acento)' : 'var(--borde)' }}
              >
                <span
                  className={`block w-6 h-6 bg-white shadow transition-transform ${
                    encendida ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {c.fuente} · {c.pesoEstimado}
              {fecha ? (
                <span className="ml-1 font-semibold" style={{ color: 'var(--acento-fuerte)' }}>· Guardada {fecha}</span>
              ) : (
                <span className="ml-1">· Sin copia offline</span>
              )}
            </p>
          </article>
        );
      })}
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Las capas WMS requieren red. Las copias GeoJSON precargadas se usan como respaldo offline.
      </p>
    </div>
  );
}
