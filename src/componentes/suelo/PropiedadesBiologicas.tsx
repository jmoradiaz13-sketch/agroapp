import { useEffect, useState } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import type { FotoLista } from '../../servicios/fotos';
import { CapturaFoto } from '../CapturaFoto';
import { DeckNavegacion } from './DeckNavegacion';
import { GaugeArco } from '../GaugeArco';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export const DIAPOSITIVAS_BIOLOGICAS: { id: string; titulo: string }[] = [
  { id: 'vida', titulo: 'Vida' },
  { id: 'vsa', titulo: 'VSA' },
  { id: 'cobertura', titulo: 'Cobertura' },
  { id: 'laboratorio', titulo: 'Laboratorio' },
  { id: 'conclusiones', titulo: 'Conclusiones' },
];

const DIAPOSITIVAS = DIAPOSITIVAS_BIOLOGICAS;

const INDICADORES_VSA = ['estructura', 'porosidad', 'color', 'lombrices', 'cobertura', 'erosion_visible'];
const NODULACION = ['sin nódulos', 'nódulos blancos (inactivos)', 'nódulos rosados (activos)'];
const OLOR = ['tierra fresca', 'neutro', 'putrefacción / azufre'];
const DESCOMPOSICION = ['residuos frescos', 'parcialmente descompuestos', 'humus estable'];

function Fuente({ texto }: { texto: string }) {
  return <p className="text-xs text-neutral-500">Fuente: {texto}</p>;
}

// Deck: una variable biológica por diapositiva, con marco, navegación
// mínima y scroll automático al contenido. Campo, laboratorio o mixto.
export function PropiedadesBiologicas({
  registro, valores, puntajes, setPuntajes,
  fotoCobertura, alFotoCobertura, alUsarCobertura,
  alIrResumen, diapositiva,
}: {
  registro: R; valores: V;
  puntajes: Record<string, number>; setPuntajes: (p: Record<string, number>) => void;
  fotoCobertura: { url: string; pct: number } | null;
  alFotoCobertura: (f: FotoLista) => Promise<void>;
  alUsarCobertura: (pct: number) => void;
  alIrResumen?: () => void; diapositiva?: number | null;
}) {
  const [indice, setIndice] = useState(0);
  const irA = (i: number) => setIndice(Math.max(0, Math.min(DIAPOSITIVAS.length - 1, i)));
  useEffect(() => {
    if (diapositiva !== undefined && diapositiva !== null) irA(diapositiva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diapositiva]);

  const tocados = INDICADORES_VSA.filter((k) => puntajes[k] !== undefined).length;

  return (
    <div className="grid gap-3">
      <div key={indice} className="animacion-entrada bg-white border border-emerald-500/40 shadow-sm rounded-sm p-5 grid gap-4 max-h-[calc(100vh-240px)] min-h-[320px] overflow-y-auto scroll-sutil content-start">
        {indice === 0 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Vida del suelo</h3>
              <p className="text-xs text-neutral-500">Macrofauna y signos vitales: el núcleo agroecológico.</p>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-2.5 grid gap-1.5 text-sm text-neutral-600">
              <p className="text-xs font-semibold text-emerald-700">Método · Cubo de 20×20×20 cm</p>
              <p>Excava el cubo y cuenta lombrices e insectos a simple vista. Nódulos rosados en leguminosas = fijación activa. Olor a tierra fresca = actividad aeróbica sana.</p>
              <p className="text-xs text-neutral-500">Fuente: Shepherd, VSA Field Guides (FAO, 2008).</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="etiqueta-campo">Lombrices (cubo 20×20×20 cm)
                <input className="campo-entrada" type="number" step="1" min="0" {...registro('lombricesConteo')} />
              </label>
              <label className="etiqueta-campo">Nodulación en leguminosas
                <select className="campo-entrada" defaultValue="" {...registro('nodulacion')}>
                  <option value="">— Sin registrar —</option>
                  {NODULACION.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="etiqueta-campo">Olor del suelo
                <select className="campo-entrada" defaultValue="" {...registro('olorSuelo')}>
                  <option value="">— Sin registrar —</option>
                  {OLOR.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="etiqueta-campo">Descomposición de MO
                <select className="campo-entrada" defaultValue="" {...registro('descomposicionMo')}>
                  <option value="">— Sin registrar —</option>
                  {DESCOMPOSICION.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
          </>
        )}

        {indice === 1 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Puntuación visual VSA</h3>
              <p className="text-xs text-neutral-500">0 pobre · 1 moderado · 2 bueno. Alimenta el índice de calidad.</p>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-2.5 grid gap-1.5 text-sm text-neutral-600">
              <p className="text-xs font-semibold text-emerald-700">Método · Tarjeta VSA</p>
              <p>Compara cada indicador con la guía fotográfica y puntúa. Ponderadores: estructura ×3, porosidad ×3, color ×2, lombrices ×2.</p>
              <p className="text-xs text-neutral-500">Fuente: Shepherd, VSA Field Guides (FAO, 2008).</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {INDICADORES_VSA.map((ind) => (
                <label key={ind} className="etiqueta-campo">{ind.replace('_', ' ')}
                  <select
                    className="campo-entrada"
                    value={puntajes[ind] ?? ''}
                    onChange={(e) => setPuntajes({ ...puntajes, [ind]: Number(e.target.value) })}
                  >
                    <option value="">—</option>
                    <option value={0}>0 — pobre</option>
                    <option value={1}>1 — moderado</option>
                    <option value={2}>2 — bueno</option>
                  </select>
                </label>
              ))}
            </div>
            <p className="text-xs text-neutral-500">{tocados} de {INDICADORES_VSA.length} indicadores puntuados.</p>
            <div className="bg-selva rounded-sm p-4">
              <GaugeArco
                valor={Object.values(puntajes).reduce((a, b) => a + b, 0)}
                minimo={0}
                maximo={INDICADORES_VSA.length * 2}
                titulo={`VSA · ${tocados}/${INDICADORES_VSA.length}`}
                subtexto={
                  tocados === 0 ? 'Puntúa para ver el índice'
                  : Object.values(puntajes).reduce((a, b) => a + b, 0) <= 4 ? 'Condición pobre'
                  : Object.values(puntajes).reduce((a, b) => a + b, 0) <= 8 ? 'Condición moderada'
                  : 'Buena estructura'
                }
              />
            </div>
          </>
        )}

        {indice === 2 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Cobertura por foto</h3>
              <p className="text-xs text-neutral-500">Foto cenital a ≥ 60 cm: % verde calculado offline.</p>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-2.5 grid gap-1.5 text-sm text-neutral-600">
              <p className="text-xs font-semibold text-emerald-700">Método · Canopeo</p>
              <p>Foto vertical del dosel; el sistema cuenta píxeles verdes en el dispositivo, sin red.</p>
              <p className="text-xs text-neutral-500">Fuente: Patrignani &amp; Ochsner 2015, Agronomy Journal.</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <CapturaFoto texto="Foto cenital" tipo="cobertura" alCapturar={(f) => void alFotoCobertura(f)} />
              {fotoCobertura && (
                <>
                  <img src={fotoCobertura.url} alt="Miniatura de cobertura" className="w-16 h-16 object-cover rounded-sm border border-neutral-200" />
                  <span className="text-sm">Cobertura: <strong className="font-semibold text-emerald-700">{fotoCobertura.pct} %</strong></span>
                  <button
                    type="button"
                    onClick={() => alUsarCobertura(fotoCobertura.pct)}
                    className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors"
                  >
                    Usar en la ficha
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {indice === 3 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Biología de laboratorio</h3>
              <p className="text-xs text-neutral-500">Respiración, biomasa microbiana y micorrizas del reporte.</p>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-2.5 grid gap-1.5 text-sm text-neutral-600">
              <p className="text-xs font-semibold text-emerald-700">Método · Reporte</p>
              <p>Transcribe respiración basal (CO₂), carbono de biomasa microbiana y % de colonización micorrízica.</p>
              <p className="text-xs text-neutral-500">Fuente: manual de agroecología y agroforestería.</p>
            </div>
            <div className="grid grid-cols-[1fr_7rem_4.5rem] items-center gap-2 border-b border-neutral-100 py-1.5">
              <span className="text-sm text-neutral-700">Respiración basal</span>
              <input className="campo-entrada !min-h-[44px] !py-1.5" type="number" step="0.1" min="0" aria-label="Respiración basal" {...registro('respiracionSuelo')} />
              <span className="text-xs text-neutral-400">mg C-CO₂/kg/día</span>
            </div>
            <div className="grid grid-cols-[1fr_7rem_4.5rem] items-center gap-2 border-b border-neutral-100 py-1.5">
              <span className="text-sm text-neutral-700">Carbono biomasa</span>
              <input className="campo-entrada !min-h-[44px] !py-1.5" type="number" step="0.1" min="0" aria-label="Carbono biomasa" {...registro('carbonoBiomasa')} />
              <span className="text-xs text-neutral-400">mg/kg</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="etiqueta-campo">Colonización micorrízica
                <input className="campo-entrada" placeholder="Ej: 60 % raíces colonizadas" {...registro('micorrizas')} />
              </label>
              <label className="etiqueta-campo">Cobertura vegetal (%)
                <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('coberturaVegetalPct')} />
              </label>
            </div>
          </>
        )}

        {indice === 4 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Conclusiones biológicas</h3>
              <p className="text-xs text-neutral-500">Lo registrado en este recorrido, listo para la interpretación.</p>
            </div>
            <dl className="grid gap-1.5 text-sm border border-neutral-200 p-4">
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Lombrices</dt><dd className="font-medium">{valores.lombricesConteo !== undefined ? `${valores.lombricesConteo} / cubo` : 'Sin registrar'}</dd></div>
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">VSA</dt><dd className="font-medium">{tocados > 0 ? `${tocados} de ${INDICADORES_VSA.length} puntuados` : 'Sin registrar'}</dd></div>
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Cobertura</dt><dd className="font-medium">{valores.coberturaVegetalPct !== undefined ? `${valores.coberturaVegetalPct} %` : 'Sin registrar'}</dd></div>
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Respiración</dt><dd className="font-medium">{valores.respiracionSuelo !== undefined ? `${valores.respiracionSuelo} mg C-CO₂/kg/día` : 'Sin registrar'}</dd></div>
            </dl>
            {alIrResumen && (
              <div>
                <button type="button" onClick={alIrResumen} className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors">
                  Ir a Interpretación →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <DeckNavegacion diapositivas={DIAPOSITIVAS} indice={indice} alIr={irA} />
    </div>
  );
}
