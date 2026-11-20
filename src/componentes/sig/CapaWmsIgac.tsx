import L from 'leaflet';
import { WMSTileLayer } from 'react-leaflet';
import { CAPAS_SIG } from '../../datos/sig';
import { WMS_IGAC } from '../../servicios/sig';

export function CapasWmsIgac({ activas, opacidad }: { activas: string[]; opacidad: number }) {
  const capas = CAPAS_SIG.filter((c) => c.tipo === 'mapa' && c.capaWms && activas.includes(c.id));
  return (
    <>
      {capas.map((capa) => {
        const wms = capa.capaWms ? WMS_IGAC[capa.capaWms] : undefined;
        if (!wms) return null;
        return (
          <WMSTileLayer
            key={capa.id}
            url={wms.url}
            layers={wms.capa}
            version={wms.version}
            crs={L.CRS.EPSG4326}
            format="image/png"
            transparent
            opacity={opacidad}
            attribution={wms.fuente}
          />
        );
      })}
    </>
  );
}
