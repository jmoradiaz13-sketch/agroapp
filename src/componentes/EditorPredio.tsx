import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { baseDatos, LIMITE_CACHE_PREDIO_BYTES, tamanoCachePredio } from '../base_datos/local';

// OFFLINE total: dibujo por toques + GPS + cálculo Turf + guarda Dexie 4326.
// Sin leaflet-draw externo para mantener build estable en campo.
function CapturaToques({ alAgregar }: { alAgregar: (p: [number, number]) => void }) {
  useMapEvents({ click(e) { alAgregar([e.latlng.lng, e.latlng.lat]); } });
  return null;
}

export function EditorPredio({ identificador }: { identificador: string }) {
  const [puntos, setPuntos] = useState<[number, number][]>([]);
  const [mensaje, setMensaje] = useState('');

  const agregar = (p: [number, number]) => setPuntos((prev) => [...prev, p]);

  const usarGps = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => agregar([pos.coords.longitude, pos.coords.latitude]),
      () => setMensaje('GPS no disponible en este dispositivo')
    );
  };

  const guardar = async () => {
    if (puntos.length < 3) { setMensaje('Agrega al menos 3 puntos tocando el mapa o con GPS'); return; }
    const anillo = [...puntos, puntos[0]];
    const poligono: GeoJSON.Polygon = { type: 'Polygon', coordinates: [anillo] };
    const areaHa = turf.area(poligono) / 10000;
    const uso = await tamanoCachePredio(identificador);
    if (uso > LIMITE_CACHE_PREDIO_BYTES) { setMensaje('Límite 200 MB por predio superado'); return; }
    await baseDatos.predios.where('identificador').equals(identificador).delete();
    await baseDatos.predios.add({
      identificador, nombre: identificador,
      geometria: poligono, fechaActualizacion: new Date().toISOString(), tamanoCacheBytes: uso
    });
    setMensaje(`Predio guardado offline: ${areaHa.toFixed(2)} ha (Turf.js). Caché local - actualizado el ${new Date().toISOString()}`);
    setPuntos([]);
  };

  useEffect(() => { void tamanoCachePredio(identificador); }, [identificador]);

  return (
    <section className="grid gap-2">
      <h2 className="text-lg font-semibold text-[#141414]">Editor predial offline</h2>
      <div className="flex gap-2 flex-wrap">
        <button className="boton-campo bg-[#1b5e20] text-white px-4 py-2 text-sm font-semibold rounded-sm" onClick={usarGps}>GPS + punto</button>
        <button className="boton-campo bg-white border border-neutral-300 px-4 py-2 text-sm font-semibold rounded-sm" onClick={() => setPuntos([])}>Limpiar</button>
        <button className="boton-campo bg-[#1b5e20] text-white px-4 py-2 text-sm font-semibold rounded-sm" onClick={() => void guardar()}>Guardar offline</button>
      </div>
      <MapContainer center={[4.65, -74.05]} zoom={14} style={{ height: 300, width: '100%' }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <CapturaToques alAgregar={agregar} />
        {puntos.length > 0 && <Marker position={[puntos[puntos.length - 1][1], puntos[puntos.length - 1][0]]} />}
      </MapContainer>
      <p>Puntos: {puntos.length} — toca el mapa para dibujar (funciona sin conexión si los tiles están cacheados).</p>
      {mensaje && <p className="mensaje-ok text-sm">{mensaje}</p>}
    </section>
  );
}
