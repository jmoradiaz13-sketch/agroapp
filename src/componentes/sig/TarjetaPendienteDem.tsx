import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import type { LoteLocal } from '../../base_datos/local';
import type { EstimacionDem } from '../../servicios/sig';

// Tarjeta de pendiente DEM por lote: selector, cálculo SRTM y guardado
// en Dexie para trabajo offline en campo.
export function TarjetaPendienteDem({
  predioId, lotes, loteSel, alElegirLote, estimacion, calculando, alCalcular, alGuardar,
}: {
  predioId: string;
  lotes: LoteLocal[];
  loteSel: number | undefined;
  alElegirLote: (id: number) => void;
  estimacion: EstimacionDem | null;
  calculando: boolean;
  alCalcular: () => void;
  alGuardar: () => void;
}) {
  return (
    <Tarjeta titulo="Pendiente DEM del lote">
      {lotes.length === 0 ? (
        <p className="mensaje-info">Sin lotes en {predioId}. Dibuja el primero en Lotes o siembra la demo en Predios.</p>
      ) : (
        <>
          <label className="etiqueta-campo">
            Lote
            <select
              value={loteSel ?? ''}
              onChange={(e) => alElegirLote(Number(e.target.value))}
              className="campo-entrada"
            >
              {lotes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre} · pendiente actual: {l.pendientePct ?? '?'} %
                </option>
              ))}
            </select>
          </label>
          <Boton onClick={alCalcular} disabled={calculando}>
            {calculando ? 'Muestreando DEM…' : 'Calcular pendiente DEM'}
          </Boton>
          {estimacion && (
            <div className="grid gap-1 border border-neutral-200 p-3">
              <p className="text-sm">
                Media <strong className="font-semibold">{estimacion.pendiente_pct} %</strong>
                {' '}· máx {estimacion.pendiente_max_pct} % · desnivel {estimacion.desnivel_m} m
              </p>
              <p className="text-sm font-semibold text-emerald-700 capitalize">{estimacion.clase}</p>
              <p className="text-xs text-neutral-600">{estimacion.manejo}</p>
              <p className="text-[11px] text-neutral-500">Fuente: {estimacion.fuente}</p>
              <div>
                <Boton onClick={alGuardar}>Guardar en el lote</Boton>
              </div>
            </div>
          )}
        </>
      )}
    </Tarjeta>
  );
}
