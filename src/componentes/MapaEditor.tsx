import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { baseDatos, tamanoCachePredio, LIMITE_CACHE_PREDIO_BYTES } from '../base_datos/local';
import { Boton, BotonSecundario } from './ui/Boton';
import { Tarjeta } from './ui/Tarjeta';
import { colorPrecision, usarGps } from '../servicios/gps';

// Mapa único: modo ver (predio+lotes) / dibujar (toques+GPS). Reemplaza MapaPredio+EditorPredio.
function Toques({ alAgregar }: { alAgregar: (p: [number, number]) => void }) {
  useMapEvents({ click(e) { alAgregar([e.latlng.lng, e.latlng.lat]); } });
  return null;
}

export function MapaEditor({ identificador }: { identificador: string }) {
  const [modo, setModo] = useState<'ver' | 'dibujar'>('ver');
  const [puntos, setPuntos] = useState<[number, number][]>([]);
  const [mensaje, setMensaje] = useState('');
  const [muestreo, setMuestreo] = useState<{ codigo: string; lat: number; lng: number }[]>([]);
  const { precision, ubicar } = usarGps();

  const agregarGps = () => {
    ubicar((lat, lng) => setPuntos((v) => [...v, [lng, lat]]));
  };

  useEffect(() => {
    void baseDatos.puntosMuestreo.where('predioIdentificador').equals(identificador).toArray()
      .then((lista) => setMuestreo(lista.map((p) => ({ codigo: p.codigo, lat: p.lat, lng: p.lng }))));
  }, [identificador, modo]);

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
            <BotonSecundario onClick={agregarGps}>
              GPS + punto{precision !== null ? ` ±${Math.round(precision)}m` : ''}
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
        {muestreo.map((m) => (
          <Marker key={m.codigo} position={[m.lat, m.lng]}>
            <Popup>{m.codigo} · punto de muestreo</Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="text-sm flex flex-wrap items-center gap-2">
        <span>Puntos: {puntos.length} · Muestreo: {muestreo.length} {modo === 'dibujar' ? '— toca el mapa' : '— tiles cacheados funcionan offline'}</span>
        {precision !== null && (
          <span
            className="text-[11px] font-bold rounded-full px-2.5 py-1 text-white"
            style={{ background: colorPrecision(precision) }}
            role="status"
          >
            GPS ±{Math.round(precision)} m{precision > 30 ? ' · poca precisión' : ''}
          </span>
        )}
      </p>
      {mensaje && <p className="mensaje-ok text-sm">{mensaje}</p>}
    </Tarjeta>
  );
}
