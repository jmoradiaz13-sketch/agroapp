import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, Rectangle, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LEYENDA_NDVI, LEYENDA_PENDIENTE } from '../../datos/sig';
import { WMS_IGAC } from '../../servicios/sig';
import { colorPrecision, usarGps } from '../../servicios/gps';

// Mapa SIG único: OSM + WMS oficial IGAC (oficina online) + copia GeoJSON
// precargada en Dexie (campo offline), con el lenguaje OneSoil/QField:
// toggles, opacidad, leyenda y punto GPS.
const POLIGONO_DEMO: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[-74.06, 4.66], [-74.03, 4.66], [-74.03, 4.63], [-74.06, 4.63], [-74.06, 4.66]]],
};

export function MapaSig({
  capasActivas,
  opacidad,
  modoNdvi,
  geoGuardado = [],
  mostrarWms = true,
}: {
  capasActivas: string[];
  opacidad: number;
  modoNdvi: 'pendiente' | 'ndvi';
  geoGuardado?: GeoJSON.Geometry[];
  mostrarWms?: boolean;
}) {
  const { pos: posGps, precision, mensaje, ubicar } = usarGps();
  const ubicarme = () => ubicar();

  const verIgac = capasActivas.includes('igac-agrologia') || capasActivas.includes('igac-predial');
  const verPendiente = capasActivas.includes('pendiente') && modoNdvi === 'pendiente';
  const verNdvi = capasActivas.includes('ndvi') && modoNdvi === 'ndvi';
  const enLinea = typeof navigator === 'undefined' ? true : navigator.onLine;

  return (
    <div className="grid gap-2">
      <MapContainer
        center={[4.645, -74.045]}
        zoom={14}
        style={{ height: '50vh', minHeight: 300, width: '100%' }}
        className="rounded-sm border border-neutral-200 z-0"
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap · IGAC · Copernicus" />
        {verIgac && mostrarWms && enLinea && (
          <WMSTileLayer
            url={WMS_IGAC.url}
            layers={WMS_IGAC.capa}
            format="image/png"
            transparent
            version="1.3.0"
            opacity={opacidad}
            attribution="IGAC · Colombia en Mapas"
          />
        )}
        {verIgac && geoGuardado.length > 0 && (
          <>
            {geoGuardado.map((g, i) => (
              <GeoJSON
                key={i}
                data={g as unknown as GeoJSON.GeoJsonObject}
                style={{ color: '#b45309', weight: 2, fillOpacity: 0 }}
              />
            ))}
          </>
        )}
        {verIgac && geoGuardado.length === 0 && (!mostrarWms || !enLinea) && (
          <GeoJSON
            data={POLIGONO_DEMO as unknown as GeoJSON.GeoJsonObject}
            style={{ color: '#059669', weight: 2, dashArray: '6 4', fillOpacity: 0 }}
          />
        )}
        {verPendiente && (
          <>
            <Rectangle bounds={[[4.63, -74.06], [4.64, -74.045]]} pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: opacidad }}><Popup>Plano &lt; 7 % · mecanizable</Popup></Rectangle>
            <Rectangle bounds={[[4.64, -74.06], [4.65, -74.045]]} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: opacidad }}><Popup>Ondulado 7–25 % · curvas a nivel</Popup></Rectangle>
            <Rectangle bounds={[[4.65, -74.06], [4.66, -74.045]]} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: opacidad }}><Popup>Empinado &gt; 25 % · cobertura permanente</Popup></Rectangle>
          </>
        )}
        {verNdvi && (
          <>
            <Rectangle bounds={[[4.63, -74.045], [4.645, -74.03]]} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: opacidad }}><Popup>NDVI &lt; 0,3 · verificar en campo</Popup></Rectangle>
            <Rectangle bounds={[[4.645, -74.045], [4.66, -74.03]]} pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: opacidad }}><Popup>NDVI &gt; 0,6 · vigoroso</Popup></Rectangle>
          </>
        )}
        {posGps && (
          <>
            {precision !== null && (
              <Circle
                center={posGps}
                radius={Math.max(precision, 5)}
                pathOptions={{ color: colorPrecision(precision), fillColor: colorPrecision(precision), fillOpacity: 0.2, weight: 2 }}
              />
            )}
            <Marker position={posGps}>
              <Popup>Estoy aquí{precision !== null ? ` · GPS ±${Math.round(precision)} m` : ''} · crea un punto de muestreo</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={ubicarme} className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-selva text-white hover:bg-selva-profundo transition-colors">
          ◎ Mi ubicación GPS
        </button>
        {precision !== null && (
          <span
            className="text-[11px] font-bold rounded-full px-2.5 py-1 text-white"
            style={{ background: colorPrecision(precision) }}
            role="status"
          >
            GPS ±{Math.round(precision)} m
          </span>
        )}
        <p className="text-xs text-neutral-500" role="status">{mensaje || (enLinea ? 'En línea: WMS oficial IGAC + copia offline en naranja.' : 'Sin red: copia GeoJSON precargada en verde punteado.')}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="border border-neutral-200 rounded-sm p-3 grid gap-1.5">
          <p className="text-[11px] font-bold tracking-widest text-neutral-500">LEYENDA · PENDIENTE</p>
          {LEYENDA_PENDIENTE.map((l) => (
            <p key={l.rango} className="text-xs text-neutral-600 flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} aria-hidden />{l.rango} · {l.texto}
            </p>
          ))}
        </div>
        <div className="border border-neutral-200 rounded-sm p-3 grid gap-1.5">
          <p className="text-[11px] font-bold tracking-widest text-neutral-500">LEYENDA · NDVI</p>
          {LEYENDA_NDVI.map((l) => (
            <p key={l.rango} className="text-xs text-neutral-600 flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} aria-hidden />{l.rango} · {l.texto}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
