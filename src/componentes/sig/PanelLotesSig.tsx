import type { LoteLocal } from '../../base_datos/local';
import { usoMapaSIG } from '../../estado/usoMapaSIG';
import { formatearArea } from '../../servicios/geo';
import { Tarjeta } from '../ui/Tarjeta';

export function PanelLotesSig({ lotes, mensaje }: { lotes: LoteLocal[]; mensaje: string }) {
  const { loteSeleccionadoId, seleccionarLote, editarLote } = usoMapaSIG();
  const loteSel = loteSeleccionadoId ?? undefined;

  return (
    <Tarjeta titulo={`Predio y lotes${lotes.length ? ` · ${lotes.length}` : ''}`}>
      {lotes.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Aún no hay lotes guardados en este dispositivo. Usa “+ Lote” en el mapa para delimitar el primero.
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {lotes.map((lote) => {
            const activo = lote.id === loteSel;
            return (
              <li key={lote.id} className="border" style={{ borderColor: activo ? 'var(--acento)' : 'var(--borde)' }}>
                <button
                  type="button"
                  onClick={() => seleccionarLote(lote.id ?? null)}
                  className="w-full text-left px-3 py-2 grid gap-0.5 min-h-[44px]"
                  style={{ background: activo ? 'var(--acento-suave)' : 'var(--sup)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--texto)' }}>{lote.nombre}</span>
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {lote.areaHa ? formatearArea(lote.areaHa) : 'Área pendiente'}
                    {lote.usoActual ? ` · ${lote.usoActual}` : ''}
                  </span>
                </button>
                {activo && (
                  <button
                    type="button"
                    onClick={() => editarLote(lote)}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-semibold border-t"
                    style={{ borderColor: 'var(--borde)', color: 'var(--acento-fuerte)' }}
                  >
                    Editar lindero en el mapa →
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {mensaje && <p className="text-xs mt-2" role="status" style={{ color: 'var(--muted)' }}>{mensaje}</p>}
    </Tarjeta>
  );
}
