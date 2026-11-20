import { colorPrecision } from '../../servicios/gps';
import { formatearCoordenada } from '../../servicios/geo';

export function BarraEstadoMapa({
  lat,
  lng,
  zoom,
  lotes,
  puntos,
  vertices,
  precision,
  mensaje,
  enLinea,
}: {
  lat: number;
  lng: number;
  zoom: number;
  lotes: number;
  puntos: number;
  vertices: number | null;
  precision: number | null;
  mensaje: string;
  enLinea: boolean;
}) {
  const metrosPorPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
  const escala = Math.round((metrosPorPixel * 96) / 0.0254);

  return (
    <div
      className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[11px] border shadow-lg"
      style={{ zIndex: 900, background: 'var(--sup)', borderColor: 'var(--borde)', color: 'var(--texto)' }}
      role="status"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <span>{formatearCoordenada(lat, lng)}</span>
      <span>Zoom {zoom}</span>
      <span>1:{escala.toLocaleString('es-CO')}</span>
      <span>{lotes} lote{lotes === 1 ? '' : 's'}</span>
      <span>{puntos} punto{puntos === 1 ? '' : 's'}</span>
      {vertices !== null && <span className="font-semibold">Edición activa · {vertices} vértices</span>}
      <span className="px-2 py-0.5 font-bold text-white" style={{ background: enLinea ? '#14736e' : '#b45309' }}>
        {enLinea ? 'En línea' : 'Sin red · offline'}
      </span>
      {precision !== null && (
        <span className="px-2 py-0.5 font-bold text-white" style={{ background: colorPrecision(precision) }}>
          GPS ±{Math.round(precision)} m
        </span>
      )}
      {mensaje && (
        <span className="font-semibold" style={{ color: 'var(--acento-fuerte)' }}>
          {mensaje}
        </span>
      )}
    </div>
  );
}
