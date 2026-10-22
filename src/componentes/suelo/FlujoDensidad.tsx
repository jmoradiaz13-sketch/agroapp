import { useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  calcularDA, calcularPorosidad, interpretarDensidad, DENSIDAD_REAL_SUPUESTA,
  type ClaseTextural,
} from '../../datos/fisicas';
import {
  PASOS_DENSIDAD, METODOS_DENSIDAD, ADVERTENCIA_DENSIDAD, FUENTES_DENSIDAD_METODO,
  textoEstadoDensidad, type MetodoDensidad,
} from '../../datos/densidad';
import { ProgresoPasos } from './ProgresoPasos';
import { SemaforoDensidad } from './fisicas_apoyo';

const BOTON_PRIMARIO =
  'boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const BOTON_OPCION =
  'boton-campo text-left px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#059669] transition-colors';
const BOTON_GHOST = 'text-xs text-emerald-700 underline underline-offset-2 w-fit';

const ILUSTRACION_METODO: Record<MetodoDensidad, string> = {
  anillo: 'densidad-cilindro',
  parafina: 'densidad-terron',
  directo: 'densidad-secado',
};

// Flujo guiado de densidad aparente: preparación → método → medición → resultado.
// Al confirmar, deja la DA y la porosidad en la ficha.
export function FlujoDensidad({ fijar, valores, claseTextural }: {
  fijar: UseFormSetValue<FichaSueloFormulario>;
  valores: Partial<FichaSueloFormulario>;
  claseTextural: ClaseTextural | null;
}) {
  const [paso, setPaso] = useState(0);
  const [metodo, setMetodo] = useState<MetodoDensidad>('anillo');
  const [diametro, setDiametro] = useState('');
  const [altura, setAltura] = useState('');
  const [pesoSeco, setPesoSeco] = useState('');
  const [volumen, setVolumen] = useState('');
  const [daDirecta, setDaDirecta] = useState('');

  const volAnillo = diametro && altura
    ? Math.round(Math.PI * (Number(diametro) / 2) ** 2 * Number(altura) * 100) / 100
    : null;
  const volEfectivo = metodo === 'anillo' ? volAnillo : metodo === 'parafina' && volumen ? Number(volumen) : null;
  const da = metodo === 'directo'
    ? (daDirecta ? Number(daDirecta) : null)
    : volEfectivo && pesoSeco ? calcularDA(Number(pesoSeco), volEfectivo) : null;
  const daNum = da !== null && Number.isFinite(da) && da > 0 ? da : null;

  const dr = valores.densidadReal ?? DENSIDAD_REAL_SUPUESTA;
  const poro = daNum !== null ? calcularPorosidad(daNum, dr) : null;
  const estado = daNum !== null && claseTextural ? interpretarDensidad(daNum, claseTextural) : null;

  const ir = (i: number) => setPaso(Math.max(0, Math.min(PASOS_DENSIDAD.length - 1, i)));
  const elegirMetodo = (m: MetodoDensidad) => { setMetodo(m); ir(2); };

  const usar = () => {
    if (daNum === null) return;
    fijar('densidadAparente', daNum);
    if (poro !== null && valores.porosidadPct === undefined) fijar('porosidadPct', poro);
  };

  const ilustracion = paso === 0 ? 'densidad-secado' : paso === 3 ? null : ILUSTRACION_METODO[metodo];

  return (
    <div className="grid gap-3">
      <ProgresoPasos pasos={PASOS_DENSIDAD} actual={paso} />

      <div className="border border-neutral-200 bg-neutral-50/60 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[168px_1fr] sm:items-start">
          {ilustracion && (
            <img
              src={`/imagenes/metodos/${ilustracion}.svg`}
              alt="Apoyo visual del método de densidad"
              loading="lazy"
              className="w-full max-w-[168px] self-start"
            />
          )}
          <div className="grid gap-2.5">
            {paso === 0 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">Prepara la muestra</p>
                <ul className="grid list-disc gap-0.5 pl-4 text-sm text-neutral-600">
                  <li>Clava el cilindro sin compactar el suelo, enrasa y retira el exceso con cuidado.</li>
                  <li>Seca a 105 °C durante 24 h (o hasta peso constante) y pesa la masa seca.</li>
                  <li>Terrón: recubre con parafina y mide el volumen por desplazamiento.</li>
                  <li>Si solo tienes el reporte, transcribe la densidad aparente del laboratorio.</li>
                </ul>
                <div><button type="button" className={BOTON_PRIMARIO} onClick={() => ir(1)}>Empezar</button></div>
              </>
            )}

            {paso === 1 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">¿Cómo obtuviste el dato?</p>
                <div className="grid gap-2">
                  {METODOS_DENSIDAD.map((m) => (
                    <button key={m.id} type="button" className={BOTON_OPCION} onClick={() => elegirMetodo(m.id)}>
                      <span className="block">{m.titulo}</span>
                      <span className="mt-0.5 block text-xs font-normal text-neutral-500">{m.detalle}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {paso === 2 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">
                  {metodo === 'anillo' ? 'Mide el cilindro y el peso seco' : metodo === 'parafina' ? 'Mide el peso seco y el volumen del terrón' : 'Escribe la densidad aparente del reporte'}
                </p>
                {metodo === 'anillo' && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="etiqueta-campo">Ø (cm)<input className="campo-entrada" type="number" step="0.1" min="0" value={diametro} onChange={(e) => setDiametro(e.target.value)} /></label>
                      <label className="etiqueta-campo">h (cm)<input className="campo-entrada" type="number" step="0.1" min="0" value={altura} onChange={(e) => setAltura(e.target.value)} /></label>
                      <label className="etiqueta-campo">P. seco (g)<input className="campo-entrada" type="number" step="0.1" min="0" value={pesoSeco} onChange={(e) => setPesoSeco(e.target.value)} /></label>
                    </div>
                    {volAnillo !== null && <p className="text-xs text-neutral-500">Volumen del cilindro: {volAnillo} cm³.</p>}
                  </>
                )}
                {metodo === 'parafina' && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="etiqueta-campo">P. seco (g)<input className="campo-entrada" type="number" step="0.1" min="0" value={pesoSeco} onChange={(e) => setPesoSeco(e.target.value)} /></label>
                    <label className="etiqueta-campo">Volumen (cm³)<input className="campo-entrada" type="number" step="0.1" min="0" value={volumen} onChange={(e) => setVolumen(e.target.value)} /></label>
                  </div>
                )}
                {metodo === 'directo' && (
                  <label className="etiqueta-campo">DA del reporte (g/cm³)
                    <input className="campo-entrada" type="number" step="0.01" min="0" value={daDirecta} onChange={(e) => setDaDirecta(e.target.value)} />
                  </label>
                )}
                <p className="text-sm text-neutral-600">
                  DA = masa seca ÷ volumen
                  {daNum !== null ? <> = <strong className="font-semibold text-neutral-800">{daNum} g/cm³</strong></> : <span className="text-neutral-400"> (completa los datos)</span>}
                </p>
                <div>
                  <button type="button" className={BOTON_PRIMARIO} disabled={daNum === null} onClick={() => ir(3)}>
                    Ver resultado
                  </button>
                </div>
              </>
            )}

            {paso === 3 && daNum !== null && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Densidad aparente</p>
                <p className="text-2xl font-semibold text-neutral-800">{daNum} <span className="text-sm font-normal text-neutral-500">g/cm³</span></p>
                {poro !== null && <p className="text-sm text-neutral-600">Porosidad ≈ <strong className="font-semibold text-neutral-800">{poro} %</strong> (con DR = {dr} g/cm³).</p>}
                {estado && claseTextural ? (
                  <div className="grid gap-1.5">
                    <SemaforoDensidad da={daNum} clase={claseTextural} />
                    <p className="text-sm text-neutral-600">{textoEstadoDensidad(estado)}</p>
                  </div>
                ) : (
                  <p className="mensaje-info">Registra la textura (tacto o granulometría) para interpretar la densidad por clase.</p>
                )}
                {valores.densidadReal === undefined && (
                  <p className="text-xs text-neutral-500">Sin densidad real de laboratorio se usa DR = 2,65 g/cm³ (supuesto documentado). Si la tienes, regístrala para afinar la porosidad.</p>
                )}
                {valores.porosidadPct !== undefined && (
                  <p className="text-xs text-neutral-500">Porosidad de laboratorio registrada ({valores.porosidadPct} %): se conserva, no se sobrescribe.</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button type="button" className={BOTON_PRIMARIO} onClick={usar}>
                    Usar esta densidad en la ficha
                  </button>
                  <button type="button" className={BOTON_GHOST} onClick={() => ir(2)}>Corregir datos</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {paso > 0 && <button type="button" className={BOTON_GHOST} onClick={() => ir(paso - 1)}>← Paso anterior</button>}
      {valores.densidadAparente !== undefined && (
        <p className="text-xs text-neutral-500">Registrado en la ficha: <strong className="font-semibold text-neutral-700">{valores.densidadAparente} g/cm³</strong></p>
      )}
      <p className="text-xs text-neutral-500">{ADVERTENCIA_DENSIDAD}</p>
      <p className="text-[11px] text-neutral-400">Fuente: {FUENTES_DENSIDAD_METODO[0]}; {FUENTES_DENSIDAD_METODO[1]}; {FUENTES_DENSIDAD_METODO[2]}.</p>
    </div>
  );
}
