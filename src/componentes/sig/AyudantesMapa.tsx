import { useEffect } from 'react';
import type { LeafletMouseEvent, Map as MapaLeaflet } from 'leaflet';
import { useMap, useMapEvents } from 'react-leaflet';
import type { Bbox, Coordenada } from '../../servicios/geo';

export function CapturarMapa({ alListo }: { alListo: (mapa: MapaLeaflet) => void }) {
  const mapa = useMap();
  useEffect(() => alListo(mapa), [mapa, alListo]);
  return null;
}

export function RastreadorMapa({ alCambiar }: { alCambiar: (lat: number, lng: number, zoom: number) => void }) {
  const mapa = useMap();
  useEffect(() => {
    const reportar = (lat: number, lng: number) => alCambiar(lat, lng, mapa.getZoom());
    const alMover = (evento: LeafletMouseEvent) => reportar(evento.latlng.lat, evento.latlng.lng);
    const alCentro = () => {
      const centro = mapa.getCenter();
      reportar(centro.lat, centro.lng);
    };
    reportar(mapa.getCenter().lat, mapa.getCenter().lng);
    mapa.on('mousemove', alMover);
    mapa.on('moveend', alCentro);
    mapa.on('zoomend', alCentro);
    return () => {
      mapa.off('mousemove', alMover);
      mapa.off('moveend', alCentro);
      mapa.off('zoomend', alCentro);
    };
  }, [alCambiar, mapa]);
  return null;
}

export function ToquesMapa({ alAgregar }: { alAgregar: (punto: Coordenada) => void }) {
  useMapEvents({
    click(evento) {
      alAgregar([evento.latlng.lng, evento.latlng.lat]);
    },
  });
  return null;
}

export function ajustarVista(mapa: MapaLeaflet, bbox: Bbox | null) {
  if (!bbox) return;
  mapa.fitBounds(
    [
      [bbox.sur, bbox.oeste],
      [bbox.norte, bbox.este],
    ],
    { padding: [30, 30], maxZoom: 18, animate: true },
  );
}
