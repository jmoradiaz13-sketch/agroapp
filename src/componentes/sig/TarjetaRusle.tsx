import { useState } from 'react';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import { baseDatos, type LoteLocal } from '../../base_datos/local';
import { pedirLluvia, type LluviaIdeam, type ResultadoRusle } from '../../servicios/sig';

// Tarjeta RUSLE: A = R·K·LS·C·P con la pendiente DEM del lote y valores
// andinos editables. Guarda la clase de erosión en el lote.
export function TarjetaRusle({
  predioId, lotes, loteSel, pendienteDem, coberturaPct, alCobertura,
  longitudM, alLongitud, rVal, alR, kVal, alK, practica, alPractica,
  rusle, calculando, alCalcular, alGuardar,
}: {
  predioId: string;
  lotes: LoteLocal[];
  loteSel: number | undefined;
  pendienteDem: number | undefined;
  coberturaPct: number; alCobertura: (v: number) => void;
  longitudM: number; alLongitud: (v: number) => void;
  rVal: number; alR: (v: number) => void;
  kVal: number; alK: (v: number) => void;
  practica: string; alPractica: (v: string) => void;
  rusle: ResultadoRusle | null;
  calculando: boolean;
  alCalcular: () => void;
  alGuardar: () => void;
}) {
  const [lluvia, setLluvia] = useState<LluviaIdeam | null>(null);
  const [mensajeLluvia, setMensajeLluvia] = useState('');

  const consultarLluvia = async () => {
    const predio = (await baseDatos.predios.where('identificador').equals(predioId).toArray())[0];
    if (!predio?.municipio) {
      setMensajeLluvia('Registra el municipio del predio para consultar IDEAM.');
      return;
    }
    const modo = navigator.onLine ? 'real' : 'demo';
    let resp = await pedirLluvia(predio.municipio, modo);
    if (!resp.ok && modo === 'real') resp = await pedirLluvia(predio.municipio, 'demo');
    if (resp.ok && resp.lluvia) {
      setLluvia(resp.lluvia);
      setMensajeLluvia('');
    } else {
      setMensajeLluvia(resp.error ?? 'Sin lluvia IDEAM.');
    }
  };

  return (
    <Tarjeta titulo="Riesgo erosión (RUSLE)">
      {lotes.length === 0 ? (
        <p className="mensaje-info">Sin lotes en {predioId}. El cálculo usa la pendiente del lote seleccionado.</p>
      ) : (
        <>
          <p className="text-xs text-neutral-600 leading-relaxed">
            A = R·K·LS·C·P. LS viene de la pendiente DEM
            ({pendienteDem ?? lotes.find((l) => l.id === loteSel)?.pendientePct ?? '?'} %);
            C de tu cobertura, R/K/P con valores andinos editables.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="etiqueta-campo">Cobertura vegetal (%)
              <input className="campo-entrada" type="number" min={0} max={100} value={coberturaPct} onChange={(e) => alCobertura(Number(e.target.value))} />
            </label>
            <label className="etiqueta-campo">Longitud ladera (m)
              <input className="campo-entrada" type="number" min={1} max={1000} value={longitudM} onChange={(e) => alLongitud(Number(e.target.value))} />
            </label>
            <label className="etiqueta-campo">R lluvia (Andina ~3000)
              <input className="campo-entrada" type="number" min={1} value={rVal} onChange={(e) => alR(Number(e.target.value))} />
            </label>
            <label className="etiqueta-campo">K suelo (franco ~0.03)
              <input className="campo-entrada" type="number" min={0.001} step={0.005} value={kVal} onChange={(e) => alK(Number(e.target.value))} />
            </label>
          </div>
          <div>
            <Boton onClick={() => void consultarLluvia()}>Lluvia IDEAM del municipio</Boton>
          </div>
          {mensajeLluvia && <p className="mensaje-info">{mensajeLluvia}</p>}
          {lluvia && (
            <p className="mensaje-info">
              {lluvia.municipio}: {lluvia.anual_mm} mm/año ({lluvia.estacion}, {lluvia.periodo}) · IMF {lluvia.imf}. R sigue editable.
            </p>
          )}
          <label className="etiqueta-campo">Práctica de conservación
            <select value={practica} onChange={(e) => alPractica(e.target.value)} className="campo-entrada">
              <option value="sin_practicas">Sin prácticas (P = 1)</option>
              <option value="curvas_nivel">Curvas a nivel (P = 0.6)</option>
              <option value="terrazas">Terrazas (P = 0.4)</option>
              <option value="cobertura_permanente">Cobertura permanente (P = 0.3)</option>
              <option value="bosque_restaurado">Bosque restaurado (P = 0.1)</option>
            </select>
          </label>
          <Boton onClick={alCalcular} disabled={calculando}>
            {calculando ? 'Calculando…' : 'Calcular RUSLE'}
          </Boton>
          {rusle && (
            <div className="grid gap-1 border border-neutral-200 p-3">
              <p className="text-sm">
                Pérdida <strong className="font-semibold">{rusle.perdida_t_ha_ano} t/ha/año</strong>
                {' '}· <span className="font-semibold capitalize">{rusle.clase}</span>
              </p>
              <p className="text-[11px] text-neutral-500">
                R {rusle.factores.r} · K {rusle.factores.k} · LS {rusle.factores.ls} · C {rusle.factores.c} · P {rusle.factores.p}
              </p>
              <p className="text-xs text-neutral-600">{rusle.manejo}</p>
              <div>
                <Boton onClick={alGuardar}>Guardar erosión en el lote</Boton>
              </div>
            </div>
          )}
        </>
      )}
    </Tarjeta>
  );
}
