import { Link } from 'react-router-dom';
import { PanelEstrategias } from '../PanelEstrategias';
import { TarjetaEnmienda } from '../TarjetaEnmienda';
import { SimuladorRusle } from '../SimuladorRusle';
import { AyudaCampo } from '../AyudaCampo';
import { Boton } from '../ui/Boton';
import { HistorialSueloLocal } from './HistorialSueloLocal';
import { MatrizSuelo } from './MatrizSuelo';

// Lectura: interpretar y decidir sobre el contexto activo (predio ± lote).
export function LecturaSuelo({
  predioIdentificador, loteNombre, versionSeleccionada,
}: {
  predioIdentificador: string;
  loteNombre?: string | null;
  versionSeleccionada?: number;
}) {
  return (
    <div className="grid gap-4 animacion-entrada">
      <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: '62ch' }}>
        Lectura local de la última ficha: matriz de evidencia, límites y síntesis cualitativa. El sistema sugiere,
        el técnico decide; con datos parciales se indica qué falta y qué medir para confirmar.
      </p>
      <MatrizSuelo predioIdentificador={predioIdentificador} loteNombre={loteNombre} versionSeleccionada={versionSeleccionada} />
      <HistorialSueloLocal predioIdentificador={predioIdentificador} loteNombre={loteNombre} versionActiva={versionSeleccionada} />
      <SimuladorRusle predioIdentificador={predioIdentificador} />
      <TarjetaEnmienda predioIdentificador={predioIdentificador} loteNombre={loteNombre ?? undefined} />
      <PanelEstrategias />
      <AyudaCampo
        titulo="Aprende en campo: pH, MO y Al"
        porque="El pH bajo bloquea nutrientes y el aluminio alto es tóxico para raíces; la MO amortigua ambos."
        como="Si Al/CICE supera la meta, fracciona la cal en 2,5 t/ha cada 60 días con MO y re-muestrea a los 6 meses."
        fuente="guia_de_buenas_practicas_para_la_gestion_y_uso_sostenible_de_los_suelos"
      />
      <Link to="/informe"><Boton>Generar informe</Boton></Link>
    </div>
  );
}
