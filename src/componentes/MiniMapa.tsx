import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LoteLocal } from '../base_datos/local';

function Encuadrar({ lotes }: { lotes: LoteLocal[] }) {
  const mapa = useMap();
  useEffect(() => {
    const puntos: [number, number][] = [];
    for (const l of lotes) {
      for (const anillo of l.geometria.coordinates) {
        for (const [lng, lat] of anillo) puntos.push([lat, lng]);
      }
    }
    if (puntos.length > 0) {
      try {
        mapa.fitBounds(puntos, { padding: [16, 16] });
      } catch {
        // mapa aún no listo: se ignora
      }
    }
  }, [mapa, lotes]);
  return null;
}

// Mini-GIS del dashboard (ref_1): lotes del predio en esmeralda sobre OSM.
// Solo lectura; el dibujo vive en /lote y el análisis en /sig.
export function MiniMapa({ lotes }: { lotes: LoteLocal[] }) {
  if (lotes.length === 0) {
    return <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin lotes dibujados. Delimita el primero en el mapa.</p>;
  }
  return (
    <MapContainer
      center={[4.65, -74.05]}
      zoom={13}
      style={{ height: 260, width: '100%' }}
      className="rounded-sm z-0"
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      {lotes.map((l) => (
        <GeoJSON
          key={l.id ?? l.nombre}
          data={l.geometria as unknown as GeoJSON.GeoJsonObject}
          style={{ color: '#14736E', weight: 2, fillColor: '#14736E', fillOpacity: 0.3 }}
        />
      ))}
      <Encuadrar lotes={lotes} />
    </MapContainer>
  );
}
