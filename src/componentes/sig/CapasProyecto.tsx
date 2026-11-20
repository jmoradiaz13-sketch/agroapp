import { CircleMarker, GeoJSON, Popup } from 'react-leaflet';
import type { CapaIgacLocal, LoteLocal, PredioLocal, PuntoMuestreoLocal } from '../../base_datos/local';
import { formatearArea } from '../../servicios/geo';

const ID_CAPA: Record<string, string> = {
  agrologia: 'igac-agrologia',
  predial: 'igac-predial',
};

const COLOR_PUNTO: Record<NonNullable<PuntoMuestreoLocal['tipo']>, string> = {
  muestra: '#14736e',
  arbol: '#2f855a',
  agua: '#2563eb',
  infraestructura: '#b45309',
};

const NOMBRE_PUNTO: Record<NonNullable<PuntoMuestreoLocal['tipo']>, string> = {
  muestra: 'Muestra de suelo',
  arbol: 'Árbol semillero',
  agua: 'Fuente de agua',
  infraestructura: 'Infraestructura',
};

export function CapasProyecto({
  predio,
  lotes,
  loteSeleccionadoId,
  puntos,
  capasOffline,
  capasActivas,
  mostrarOffline,
  edicionActiva,
  alSeleccionarLote,
}: {
  predio: PredioLocal | null;
  lotes: LoteLocal[];
  loteSeleccionadoId: number | null;
  puntos: PuntoMuestreoLocal[];
  capasOffline: CapaIgacLocal[];
  capasActivas: string[];
  mostrarOffline: boolean;
  edicionActiva: boolean;
  alSeleccionarLote: (id: number | null) => void;
}) {
  return (
    <>
      {predio?.geometria && (
        <GeoJSON
          data={predio.geometria}
          interactive={false}
          style={{ color: '#14736e', weight: 3, dashArray: '10 6', fillOpacity: 0.04 }}
        />
      )}

      {mostrarOffline &&
        capasOffline
          .filter((capa) => capasActivas.includes(ID_CAPA[capa.nombreCapa]))
          .map((capa) => (
            <GeoJSON
              key={`offline-${capa.id}`}
              data={capa.geojson}
              interactive={false}
              style={{ color: '#b45309', weight: 1.5, dashArray: '4 4', fillOpacity: 0.02 }}
            />
          ))}

      {lotes.map((lote) => {
        const seleccionado = lote.id === loteSeleccionadoId;
        return (
          <GeoJSON
            key={`lote-${lote.id}-${edicionActiva ? 'edicion' : 'vista'}`}
            data={lote.geometria}
            interactive={!edicionActiva}
            style={{
              color: seleccionado ? '#f59e0b' : '#2f855a',
              weight: seleccionado ? 4 : 2,
              fillColor: seleccionado ? '#fbbf24' : '#10b981',
              fillOpacity: seleccionado ? 0.28 : 0.12,
            }}
            eventHandlers={edicionActiva ? undefined : { click: () => alSeleccionarLote(lote.id ?? null) }}
          >
            {!edicionActiva && (
              <Popup>
                <strong>{lote.nombre}</strong>
                <br />
                {lote.areaHa ? formatearArea(lote.areaHa) : 'Área pendiente'}
              </Popup>
            )}
          </GeoJSON>
        );
      })}

      {puntos.map((punto) => {
        const tipo = punto.tipo ?? 'muestra';
        return (
          <CircleMarker
            key={punto.codigo}
            center={[punto.lat, punto.lng]}
            radius={6}
            interactive={!edicionActiva}
            pathOptions={{ color: '#fff', weight: 2, fillColor: COLOR_PUNTO[tipo], fillOpacity: 1 }}
          >
            {!edicionActiva && (
              <Popup>
                <strong>{punto.etiqueta || punto.codigo}</strong>
                <br />
                {NOMBRE_PUNTO[tipo]} · {punto.codigo}
                {punto.loteNombre ? ` · ${punto.loteNombre}` : ''}
              </Popup>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
}
