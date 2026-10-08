import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';

function CalculoArea({ geometria }: { geometria: GeoJSON.Polygon }) {
  const mapa = useMap();
  useEffect(() => {
    const areaM2 = turf.area(geometria);
    console.log(`Área del predio: ${(areaM2 / 10000).toFixed(2)} ha (Turf.js, offline)`);
    mapa.fitBounds([
      [geometria.coordinates[0][0][1], geometria.coordinates[0][0][0]],
      [geometria.coordinates[0][2][1], geometria.coordinates[0][2][0]]
    ]);
  }, [mapa, geometria]);
  return null;
}

const geometriaEjemplo: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[-74.05, 4.65], [-74.04, 4.65], [-74.04, 4.64], [-74.05, 4.64], [-74.05, 4.65]]]
};

export function MapaPredio() {
  return (
    <MapContainer center={[4.65, -74.05]} zoom={14} style={{ height: 320, width: '100%' }}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      <CalculoArea geometria={geometriaEjemplo} />
    </MapContainer>
  );
}
