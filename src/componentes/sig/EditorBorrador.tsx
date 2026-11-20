import L from 'leaflet';
import { CircleMarker, Marker, Polygon, Polyline } from 'react-leaflet';
import type { BorradorMapa } from '../../estado/usoMapaSIG';
import type { Coordenada } from '../../servicios/geo';

const iconoVertice = L.divIcon({
  className: '',
  html: '<span style="display:block;width:16px;height:16px;border:2px solid #7c2d12;background:#fbbf24;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function EditorBorrador({
  borrador,
  alMover,
}: {
  borrador: BorradorMapa;
  alMover: (indice: number, punto: Coordenada) => void;
}) {
  const posiciones = borrador.puntos.map(([lng, lat]) => [lat, lng] as [number, number]);
  const cerrado = borrador.puntos.length >= 3;

  return (
    <>
      {posiciones.length >= 2 && (
        <Polyline
          positions={posiciones}
          pathOptions={{ color: '#b45309', weight: 3, dashArray: cerrado ? undefined : '6 6' }}
        />
      )}
      {cerrado && (
        <Polygon
          positions={posiciones}
          pathOptions={{ color: '#b45309', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.18 }}
        />
      )}
      {posiciones.map((posicion, indice) => (
        <Marker
          key={`vertice-${indice}`}
          position={posicion}
          icon={iconoVertice}
          draggable
          bubblingMouseEvents={false}
          eventHandlers={{
            dragend: (evento) => {
              const { lat, lng } = evento.target.getLatLng();
              alMover(indice, [lng, lat]);
            },
          }}
        />
      ))}
      {borrador.puntos.length > 0 && (
        <CircleMarker
          center={[borrador.puntos[0][1], borrador.puntos[0][0]]}
          radius={10}
          bubblingMouseEvents={false}
          pathOptions={{ color: '#14532d', weight: 2, fillColor: '#22c55e', fillOpacity: 0.9 }}
        />
      )}
    </>
  );
}
