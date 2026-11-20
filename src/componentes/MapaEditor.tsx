import { Tarjeta } from './ui/Tarjeta';
import { MapaTrabajo } from './sig/MapaTrabajo';

// Envoltorio de compatibilidad para /lote: el mismo taller SIG que /sig.
// La delimitación y edición se hacen ahora en MapaTrabajo (offline).
export function MapaEditor({ identificador }: { identificador: string }) {
  return (
    <Tarjeta titulo={`Mapa de lotes — ${identificador}`}>
      <MapaTrabajo identificador={identificador} altura="420px" />
      <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
        Toca un lote para seleccionarlo, o usa “Delimitar predio” y “+ Lote”. Los cambios se guardan en Dexie y
        quedan pendientes de sincronizar.
      </p>
    </Tarjeta>
  );
}
