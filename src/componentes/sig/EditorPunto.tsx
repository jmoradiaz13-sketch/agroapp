import L from 'leaflet';
import { Marker } from 'react-leaflet';
import type { PuntoBorrador, TipoPunto } from '../../estado/usoMapaSIG';
import type { Coordenada } from '../../servicios/geo';

const COLOR: Record<TipoPunto, string> = {
  muestra: '#14736e',
  arbol: '#2f855a',
  agua: '#2563eb',
  infraestructura: '#b45309',
};

const icono = (tipo: TipoPunto) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border:2px solid #fff;background:${COLOR[tipo]};border-radius:9999px;box-shadow:0 1px 5px rgba(0,0,0,.45)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

export function EditorPunto({
  punto,
  alMover,
}: {
  punto: PuntoBorrador;
  alMover: (coordenada: Coordenada) => void;
}) {
  if (!punto.coordenada) return null;
  const [lng, lat] = punto.coordenada;
  return (
    <Marker
      position={[lat, lng]}
      icon={icono(punto.tipo)}
      draggable
      bubblingMouseEvents={false}
      eventHandlers={{
        dragend: (evento) => {
          const destino = evento.target.getLatLng();
          alMover([destino.lng, destino.lat]);
        },
      }}
    />
  );
}
