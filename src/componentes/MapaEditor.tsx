import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { baseDatos, tamanoCachePredio, LIMITE_CACHE_PREDIO_BYTES } from '../base_datos/local';
import { Boton, BotonSecundario } from './ui/Boton';
import { Tarjeta } from './ui/Tarjeta';

// Mapa único: modo ver (predio+lotes) / dibujar (toques+GPS). Reemplaza MapaPredio+EditorPredio.
function Toques({ alAgregar }: { alAgregar: (p: [number, number]) => void }) {
  useMapEvents({ click(e) { alAgregar([e.latlng.lng, e.latlng.lat]); } });
  return null;
}

export function MapaEditor({ identificador }: { identificador: string }) {
  const [modo, setModo] = useState<'ver' | 'dibujar'>('ver');
  const [puntos, setPuntos] = useState<[number, number][]>([]);
  const [mensaje, setMensaje] = useState('');

  const guardar = async () => {
    if (puntos.length < 3) { setMensaje('Toca ≥3 puntos en modo dibujar'); return; }
    const poligono: GeoJSON.Polygon = { type: 'Polygon', coordinates: [[...puntos, puntos[0]]] };
    const areaHa = turf.area(poligono) / 10000;
    if ((await tamanoCachePredio(identificador)) > LIMITE_CACHE_PREDIO_BYTES) {
      setMensaje('Límite 200 MB superado'); return;
    }
    await baseDatos.lotes.add({
      predioIdentificador: identificador, nombre: `Lote ${new Date().toISOString().slice(11, 16)}`,
      areaHa: Math.round(areaHa * 100) / 100, geometria: poligono,
      fechaActualizacion: new Date().toISOString(), estadoSincronizacion: 'pendiente'
    });
    setMensaje(`Lote guardado: ${areaHa.toFixed(2)} ha (offline)`);
    setPuntos([]);
    setModo('ver');
  };

  return (
    <Tarjeta titulo={`Mapa — ${identificador}`}>
      <div className="flex gap-2 flex-wrap">
        <BotonSecundario onClick={() => setModo(modo === 'ver' ? 'dibujar' : 'ver')}>
          {modo === 'ver' ? 'Dibujar lote' : 'Ver mapa'}
        </BotonSecundario>
        {modo === 'dibujar' && (
          <>
            <BotonSecundario onClick={() => navigator.geolocation?.getCurrentPosition((p) => setPuntos((v) => [...v, [p.coords.longitude, p.coords.latitude]]))}>
              GPS + punto
            </BotonSecundario>
            <BotonSecundario onClick={() => setPuntos([])}>Limpiar</BotonSecundario>
            <Boton onClick={() => void guardar()}>Guardar lote</Boton>
          </>
        )}
      </div>
      <MapContainer center={[4.65, -74.05]} zoom={13} style={{ height: 300, width: '100%' }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {modo === 'dibujar' && <Toques alAgregar={(p) => setPuntos((v) => [...v, p])} />}
        {puntos.length > 0 && <Marker position={[puntos[puntos.length - 1][1], puntos[puntos.length - 1][0]]} />}
      </MapContainer>
      <p className="text-sm">Puntos: {puntos.length} {modo === 'dibujar' ? '— toca el mapa' : '— tiles cacheados funcionan offline'}</p>
      {mensaje && <p className="mensaje-ok text-sm">{mensaje}</p>}
    </Tarjeta>
  );
}
