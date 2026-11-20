import { BASES_MAPA } from '../../datos/sig';
import type { LoteLocal } from '../../base_datos/local';
import { usoMapaSIG, type TipoPunto } from '../../estado/usoMapaSIG';
import { formatearArea, formatearCoordenada, formatearPerimetro } from '../../servicios/geo';

const TIPOS_PUNTO: { id: TipoPunto; titulo: string }[] = [
  { id: 'muestra', titulo: 'Muestra de suelo' },
  { id: 'arbol', titulo: 'Árbol semillero' },
  { id: 'agua', titulo: 'Fuente de agua' },
  { id: 'infraestructura', titulo: 'Infraestructura' },
];

export function ControlesMapa({
  lotes,
  precision,
  problemaBorrador,
  areaBorrador,
  perimetroBorrador,
  alGps,
  alGuardar,
  alGuardarPunto,
  alRecentrar,
}: {
  lotes: LoteLocal[];
  precision: number | null;
  problemaBorrador: string | null;
  areaBorrador: number;
  perimetroBorrador: number;
  alGps: () => void;
  alGuardar: () => void;
  alGuardarPunto: () => void;
  alRecentrar: () => void;
}) {
  const {
    base,
    capasActivas,
    opacidad,
    borrador,
    puntoBorrador,
    loteSeleccionadoId,
    fijarBase,
    fijarOpacidad,
    iniciarDibujoPredio,
    iniciarDibujoLote,
    iniciarPunto,
    editarLote,
    quitarUltimo,
    cancelarDibujo,
    cancelarPunto,
    actualizarBorrador,
    actualizarPunto,
  } = usoMapaSIG();

  return (
    <div
      className="absolute left-3 top-3 grid gap-2 max-w-[calc(100%-1.5rem)] sm:max-w-[330px]"
      style={{ zIndex: 900 }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="bg-[var(--sup)] border border-[var(--borde)] shadow-lg p-2.5 grid gap-2">
        <div className="flex gap-1" role="group" aria-label="Mapa base">
          {BASES_MAPA.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => fijarBase(b.id)}
              aria-pressed={base === b.id}
              className="boton-campo flex-1 px-2 py-2 text-[11px] font-semibold border"
              style={{
                background: base === b.id ? 'var(--acento)' : 'var(--sup)',
                color: base === b.id ? '#fff' : 'var(--texto)',
                borderColor: base === b.id ? 'var(--acento)' : 'var(--borde)',
              }}
            >
              {b.titulo}
            </button>
          ))}
        </div>

        {!borrador && !puntoBorrador ? (
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={iniciarDibujoPredio}
              className="boton-campo px-3 py-2 text-xs font-semibold text-white bg-selva min-h-[44px]"
            >
              Delimitar predio
            </button>
            <button
              type="button"
              onClick={iniciarDibujoLote}
              className="boton-campo px-3 py-2 text-xs font-semibold min-h-[44px] border"
              style={{ background: 'var(--sup)', color: 'var(--texto)', borderColor: 'var(--borde)' }}
            >
              + Lote
            </button>
            <button
              type="button"
              onClick={iniciarPunto}
              className="boton-campo px-3 py-2 text-xs font-semibold min-h-[44px] border"
              style={{ background: 'var(--sup)', color: 'var(--texto)', borderColor: 'var(--borde)' }}
            >
              + Punto
            </button>
            {loteSeleccionadoId !== null && (
              <button
                type="button"
                onClick={() => {
                  const lote = lotes.find((l) => l.id === loteSeleccionadoId);
                  if (lote) editarLote(lote);
                }}
                className="boton-campo px-3 py-2 text-xs font-semibold min-h-[44px] border"
                style={{ background: 'var(--sup)', color: 'var(--texto)', borderColor: 'var(--borde)' }}
              >
                Editar lote
              </button>
            )}
            <button
              type="button"
              onClick={alRecentrar}
              className="boton-campo px-3 py-2 text-xs font-semibold min-h-[44px] border"
              style={{ background: 'var(--sup)', color: 'var(--texto)', borderColor: 'var(--borde)' }}
            >
              Recentrar
            </button>
          </div>
        ) : borrador ? (
          <div className="grid gap-2">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--texto)' }}>
              {borrador.tipo === 'predio' ? 'Perímetro del predio' : `Lote: ${borrador.nombre || 'sin nombre'}`} ·{' '}
              {borrador.puntos.length} vértices
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={alGps}
                className="boton-campo px-3 py-2 text-xs font-semibold text-white bg-selva min-h-[44px]"
              >
                GPS + vértice{precision !== null ? ` ±${Math.round(precision)} m` : ''}
              </button>
              <button
                type="button"
                onClick={quitarUltimo}
                className="boton-campo px-3 py-2 text-xs font-semibold min-h-[44px] border"
                style={{ background: 'var(--sup)', color: 'var(--texto)', borderColor: 'var(--borde)' }}
              >
                Deshacer
              </button>
              <button
                type="button"
                onClick={cancelarDibujo}
                className="boton-campo px-3 py-2 text-xs font-semibold min-h-[44px] border"
                style={{ background: 'var(--sup)', color: 'var(--texto)', borderColor: 'var(--borde)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={alGuardar}
                disabled={Boolean(problemaBorrador)}
                className="boton-campo px-3 py-2 text-xs font-semibold text-white bg-[#059669] min-h-[44px] disabled:opacity-50"
              >
                Guardar {borrador.tipo === 'predio' ? 'predio' : 'lote'}
              </button>
            </div>
            {borrador.tipo === 'lote' && (
              <input
                value={borrador.nombre}
                onChange={(e) => actualizarBorrador({ nombre: e.target.value })}
                placeholder="Nombre del lote"
                className="campo-entrada py-2 text-xs"
                aria-label="Nombre del lote"
              />
            )}
            <p className="text-[11px]" style={{ color: problemaBorrador ? '#b91c1c' : 'var(--muted)' }}>
              {problemaBorrador ??
                `Área ${formatearArea(areaBorrador)} · Perímetro ${formatearPerimetro(perimetroBorrador)} · arrastra los vértices para ajustar.`}
            </p>
          </div>
        ) : puntoBorrador ? (
          <div className="grid gap-2">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--texto)' }}>
              Nuevo punto · {puntoBorrador.coordenada ? formatearCoordenada(puntoBorrador.coordenada[1], puntoBorrador.coordenada[0]) : 'sin ubicación'}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={alGps}
                className="boton-campo px-3 py-2 text-xs font-semibold text-white bg-selva min-h-[44px]"
              >
                GPS{puntoBorrador.coordenada ? ' de nuevo' : ''}{precision !== null ? ` ±${Math.round(precision)} m` : ''}
              </button>
              <button
                type="button"
                onClick={cancelarPunto}
                className="boton-campo px-3 py-2 text-xs font-semibold min-h-[44px] border"
                style={{ background: 'var(--sup)', color: 'var(--texto)', borderColor: 'var(--borde)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={alGuardarPunto}
                disabled={!puntoBorrador.coordenada}
                className="boton-campo px-3 py-2 text-xs font-semibold text-white bg-[#059669] min-h-[44px] disabled:opacity-50"
              >
                Guardar punto
              </button>
            </div>
            <label className="grid gap-1 text-[11px]" style={{ color: 'var(--muted)' }}>
              Tipo
              <select
                value={puntoBorrador.tipo}
                onChange={(e) => actualizarPunto({ tipo: e.target.value as TipoPunto })}
                className="campo-entrada py-2 text-xs"
              >
                {TIPOS_PUNTO.map((t) => (
                  <option key={t.id} value={t.id}>{t.titulo}</option>
                ))}
              </select>
            </label>
            <input
              value={puntoBorrador.etiqueta}
              onChange={(e) => actualizarPunto({ etiqueta: e.target.value })}
              placeholder="Etiqueta (opcional)"
              className="campo-entrada py-2 text-xs"
              aria-label="Etiqueta del punto"
            />
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              Toca el mapa o usa GPS; luego arrastra el marcador para ajustar.
            </p>
          </div>
        ) : null}

        {capasActivas.length > 0 && (
          <label className="grid gap-1 text-[11px]" style={{ color: 'var(--muted)' }}>
            Opacidad capas IGAC {Math.round(opacidad * 100)} %
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={opacidad}
              onChange={(e) => fijarOpacidad(Number(e.target.value))}
              className="w-full accent-[#059669] min-h-[32px]"
              aria-label="Opacidad de capas IGAC"
            />
          </label>
        )}
      </div>
    </div>
  );
}
