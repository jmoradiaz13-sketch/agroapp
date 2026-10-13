import { useEffect, useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import type { FotoLista } from '../../servicios/fotos';
import {
  CLASES_ES, clasificarTextura,
  MUNSELL_TONOS, munsellChip, ADVERTENCIA_MUNSELL, FUENTE_MUNSELL,
  MINERALES_MUNSELL, FUENTE_MINERALES,
  FUENTE_DENSIDAD, calcularDA, calcularPorosidad,
  interpretarPorosidad, FUENTE_POROSIDAD,
  FUENTE_AGUA, calcularAguaDisponible,
} from '../../datos/fisicas';
import {
  Fuente, Columna, ArbolTextura, Triangulo, tactoAClase, SemaforoDensidad,
} from './fisicas_apoyo';
import { AyudaCampo } from '../AyudaCampo';
import { DeckNavegacion } from './DeckNavegacion';
import { FisicasEstructura } from './FisicasEstructura';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export const DIAPOSITIVAS_FISICAS: { id: string; titulo: string }[] = [
  { id: 'textura', titulo: 'Textura' },
  { id: 'color', titulo: 'Color' },
  { id: 'densidad', titulo: 'Densidad' },
  { id: 'estructura', titulo: 'Estructura' },
  { id: 'manejo', titulo: 'Manejo' },
  { id: 'conclusiones', titulo: 'Conclusiones' },
];

const DIAPOSITIVAS = DIAPOSITIVAS_FISICAS;

// Deck estilo curso/MOOC: una variable por diapositiva con fundamentos,
// medición y captura DUO (campo + laboratorio), hasta conclusiones.
export function PropiedadesFisicas({
  registro, fijar, valores, errorGranulometria, alFoto, alIrResumen, diapositiva,
}: {
  registro: R; fijar: UseFormSetValue<FichaSueloFormulario>; valores: V; errorGranulometria?: string;
  alFoto?: (f: FotoLista) => void; alIrResumen?: () => void; diapositiva?: number | null;
}) {
  const [indice, setIndice] = useState(0);
  const [metodo, setMetodo] = useState('anillo');
  const [pesoSeco, setPesoSeco] = useState('');
  const [volumen, setVolumen] = useState('');
  const [diametro, setDiametro] = useState('');
  const [altura, setAltura] = useState('');
  const [daDirecta, setDaDirecta] = useState('');

  const auto = clasificarTextura(valores.arenaPct, valores.limoPct, valores.arcillaPct);
  const claseDensidad = auto ?? (valores.texturaTacto ? tactoAClase(valores.texturaTacto) : null);
  const munsell = valores.munsellH
    ? munsellChip(valores.munsellH, valores.munsellV, valores.munsellC)
    : null;

  const volAnillo = diametro && altura
    ? Math.round(Math.PI * (Number(diametro) / 2) ** 2 * Number(altura) * 100) / 100
    : null;
  const volEfectivo = metodo === 'anillo' ? volAnillo : volumen ? Number(volumen) : null;
  const daCalc = metodo === 'directo'
    ? (daDirecta ? Number(daDirecta) : null)
    : volEfectivo && pesoSeco ? calcularDA(Number(pesoSeco), volEfectivo) : null;
  const poroCalc = daCalc !== null ? calcularPorosidad(daCalc) : null;
  const poroLab = valores.densidadAparente !== undefined ? calcularPorosidad(valores.densidadAparente) : null;

  const irA = (i: number) => setIndice(Math.max(0, Math.min(DIAPOSITIVAS.length - 1, i)));

  useEffect(() => {
    if (diapositiva !== undefined && diapositiva !== null) irA(diapositiva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diapositiva]);

  return (
    <div className="grid gap-3">
      <div key={indice} className="animacion-entrada bg-white border border-emerald-500/40 shadow-sm rounded-sm p-5 grid gap-3 lg:grid-cols-3 max-h-[calc(100vh-240px)] min-h-[320px] overflow-y-auto scroll-sutil content-start">
        {indice === 0 && (
          <>
            <Columna titulo="Fundamentos">
              <p className="text-sm text-neutral-600">Arena (2–0,05 mm), limo (0,05–0,002 mm) y arcilla (&lt; 0,002 mm) definen retención de agua, aireación y manejo.</p>
              <Triangulo arena={valores.arenaPct ?? 40} limo={valores.limoPct ?? 40} arcilla={valores.arcillaPct ?? 20} clase={auto ? CLASES_ES[auto] : 'ejemplo'} />
              <Fuente texto="FAO, Guidelines for Soil Description; USDA-NRCS, Soil Survey Manual" />
            </Columna>
            <Columna titulo="Medición">
              <p className="text-sm font-medium">Método de la cinta: 25 g, humedece, bola de 3 cm; sin bola: arenoso; cinta ≤ 2,5 cm: francos; 2,5–5 cm: franco arcillosos; más de 5 cm: arcillosos.</p>
              <img src="/imagenes/metodos/triangulo-usda.svg" alt="Triángulo textural oficial del USDA" loading="lazy" className="w-full max-w-[220px]" />
              <p className="text-[11px] text-neutral-500">Triángulo USDA (C. Aragón, CC-BY-SA 4.0, Wikimedia Commons).</p>
            </Columna>
            <Columna titulo="Captura DUO">
              <div className="grid gap-1">
                <p className="text-[11px] font-semibold text-neutral-500">Campo · tacto</p>
                <ArbolTextura alElegir={(c) => fijar('texturaTacto', c)} />
                {valores.texturaTacto && <p className="mensaje-ok">Tacto: {valores.texturaTacto}</p>}
              </div>
              <div className="grid gap-2">
                <p className="text-[11px] font-semibold text-neutral-500">Laboratorio · granulometría %</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="etiqueta-campo">Arena
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('arenaPct')} />
                  </label>
                  <label className="etiqueta-campo">Limo
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('limoPct')} />
                  </label>
                  <label className="etiqueta-campo">Arcilla
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('arcillaPct')} />
                  </label>
                </div>
                {errorGranulometria && <p className="mensaje-error">{errorGranulometria}</p>}
                {auto && <p className="mensaje-ok">Clase USDA: {CLASES_ES[auto]}</p>}
              </div>
              <p className="mensaje-info">Esmectita (2:1) se siente jabonosa aun con % moderado; caolinita (1:1), menos plástica.</p>
            </Columna>
          </>
        )}

        {indice === 1 && (
          <>
            <Columna titulo="Fundamentos">
              <p className="text-sm text-neutral-600">El color indica materia orgánica, óxidos de hierro y drenaje: negros (humus fértil), rojos (hematita, oxidación), grises (anaerobio).</p>
              <img src="/imagenes/metodos/munsell-sistema.svg" alt="Diagrama del sistema de color Munsell" loading="lazy" className="w-full max-w-[220px]" />
              <p className="text-[11px] text-neutral-500">Sistema Munsell (Jacob Rus, CC-BY-SA 3.0, Wikimedia Commons).</p>
              <Fuente texto={`USDA-NRCS, Soil Survey Manual. ${FUENTE_MUNSELL}`} />
            </Columna>
            <Columna titulo="Medición">
              <p className="text-sm font-medium">Compara el terrón con la carta bajo luz natural, en seco y en húmedo. Anota tono, valor y croma (p. ej. 10YR 3/2 húmedo).</p>
              <details className="border border-neutral-200">
                <summary className="cursor-pointer text-xs font-medium text-emerald-700 p-2.5">Tabla mineral → Munsell → color</summary>
                <div className="overflow-x-auto px-2.5 pb-2.5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-neutral-400 border-b border-neutral-200">
                        <th className="py-1 pr-2 font-medium">Mineral</th>
                        <th className="py-1 pr-2 font-medium">Munsell</th>
                        <th className="py-1 font-medium">Color</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {MINERALES_MUNSELL.map((m) => (
                        <tr key={m.mineral}>
                          <td className="py-1 pr-2 text-neutral-700">{m.mineral}</td>
                          <td className="py-1 pr-2 font-medium">{m.munsell}</td>
                          <td className="py-1 text-neutral-600">{m.color}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[11px] text-neutral-500 mt-1">Fuente: {FUENTE_MINERALES}.</p>
                </div>
              </details>
            </Columna>
            <Columna titulo="Captura DUO">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label className="etiqueta-campo">Tono (Hue)
                  <select className="campo-entrada" defaultValue="" {...registro('munsellH')}>
                    <option value="">—</option>
                    {MUNSELL_TONOS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
                <label className="etiqueta-campo">Valor
                  <select className="campo-entrada" defaultValue="" {...registro('munsellV')}>
                    <option value="">—</option>
                    {[2, 3, 4, 5, 6, 7, 8].map((vv) => <option key={vv} value={vv}>{vv}</option>)}
                  </select>
                </label>
                <label className="etiqueta-campo">Croma
                  <select className="campo-entrada" defaultValue="" {...registro('munsellC')}>
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="etiqueta-campo">Estado
                  <select className="campo-entrada" defaultValue="" {...registro('colorEstado')}>
                    <option value="">—</option>
                    <option value="humedo">Húmedo</option>
                    <option value="seco">Seco</option>
                  </select>
                </label>
              </div>
              {valores.munsellH && munsell ? (
                <div className="flex items-center gap-3 border border-neutral-200 p-3">
                  <span className="w-14 h-14 rounded-sm border border-neutral-300 shrink-0" style={{ background: munsell.css }} aria-hidden />
                  <p className="text-sm"><strong className="font-semibold">{munsell.etiqueta}</strong> {valores.colorEstado ? `(${valores.colorEstado})` : ''}</p>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">{ADVERTENCIA_MUNSELL}</p>
              )}
            </Columna>
          </>
        )}

        {indice === 2 && (
          <>
            <Columna titulo="Fundamentos">
              <p className="text-sm text-neutral-600">DA = masa seca ÷ volumen. Refleja compactación y porosidad total: valores altos frenan raíces y agua.</p>
              <img src="/imagenes/metodos/perfil-suelo.jpg" alt="Perfil de suelo con horizontes diferenciados" loading="lazy" className="w-full max-w-[220px] rounded-sm" />
              <p className="text-[11px] text-neutral-500">Perfil con horizontes (USDA, dominio público). La densidad aumenta con la profundidad.</p>
              <Fuente texto={FUENTE_DENSIDAD} />
            </Columna>
            <Columna titulo="Medición">
              <p className="text-sm font-medium">Cilindro: muestra indisturbada, 105 °C por 24 h (V = π·r²·h). Terrón: parafina + volumen desplazado. Reporte: transcribe la DA.</p>
              <p className="text-xs text-neutral-500">SENA La Granja: terrón parafinado y cilindro con corrección de humedad.</p>
              {volAnillo !== null && metodo === 'anillo' && <p className="text-xs text-neutral-500">Volumen del anillo: {volAnillo} cm³.</p>}
            </Columna>
            <Columna titulo="Captura DUO">
              <div className="grid gap-1">
                <p className="text-[11px] font-semibold text-neutral-500">Campo · cálculo</p>
                <label className="etiqueta-campo">Método
                  <select className="campo-entrada" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                    <option value="anillo">Cilindro (anillo)</option>
                    <option value="parafina">Terrón (volumen conocido)</option>
                    <option value="directo">Valor de laboratorio</option>
                  </select>
                </label>
                {metodo === 'anillo' && (
                  <div className="grid grid-cols-3 gap-2">
                    <label className="etiqueta-campo">Ø<input className="campo-entrada" type="number" step="0.1" min="0" value={diametro} onChange={(e) => setDiametro(e.target.value)} /></label>
                    <label className="etiqueta-campo">h<input className="campo-entrada" type="number" step="0.1" min="0" value={altura} onChange={(e) => setAltura(e.target.value)} /></label>
                    <label className="etiqueta-campo">P. seco<input className="campo-entrada" type="number" step="0.1" min="0" value={pesoSeco} onChange={(e) => setPesoSeco(e.target.value)} /></label>
                  </div>
                )}
                {metodo === 'parafina' && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="etiqueta-campo">P. seco<input className="campo-entrada" type="number" step="0.1" min="0" value={pesoSeco} onChange={(e) => setPesoSeco(e.target.value)} /></label>
                    <label className="etiqueta-campo">Volumen<input className="campo-entrada" type="number" step="0.1" min="0" value={volumen} onChange={(e) => setVolumen(e.target.value)} /></label>
                  </div>
                )}
                {metodo === 'directo' && (
                  <label className="etiqueta-campo">DA del reporte
                    <input className="campo-entrada" type="number" step="0.01" min="0" value={daDirecta} onChange={(e) => setDaDirecta(e.target.value)} />
                  </label>
                )}
              </div>
              <div className="grid gap-1">
                <p className="text-[11px] font-semibold text-neutral-500">Laboratorio · reporte</p>
                <label className="etiqueta-campo">DA (g/cm³)
                  <input className="campo-entrada" type="number" step="0.01" min="0" {...registro('densidadAparente')} />
                </label>
                <label className="etiqueta-campo">DR real (g/cm³)
                  <input className="campo-entrada" type="number" step="0.01" min="0" {...registro('densidadReal')} />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="etiqueta-campo">Porosidad (%)
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('porosidadPct')} />
                  </label>
                  <label className="etiqueta-campo">CC · capacidad de campo (%)
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('capacidadCampoPct')} />
                  </label>
                  <label className="etiqueta-campo">PMP · marchitez permanente (%)
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('pmpPct')} />
                  </label>
                </div>
                <AyudaCampo
                  titulo="CC, PMP y agua disponible"
                  porque="La capacidad de campo es el agua retenida a −10/−33 kPa y el punto de marchitez a −1500 kPa. Lo retenido cerca de −10 kPa es fácilmente disponible y vive en poros de 0,2–50 µm."
                  como="Registra CC y PMP del reporte; el agua disponible (CC − PMP) se calcula sola. Si PMP supera a CC, revisa el reporte: es físicamente imposible."
                  fuente={FUENTE_AGUA}
                />
                {(() => {
                  const cc = valores.capacidadCampoPct;
                  const pmp = valores.pmpPct;
                  if (cc === undefined || pmp === undefined) return null;
                  if (pmp > cc) {
                    return <p className="mensaje-error">PMP ({pmp} %) mayor que CC ({cc} %): imposible en campo. Verifica el reporte de laboratorio.</p>;
                  }
                  return (
                    <p className="mensaje-ok">
                      Agua disponible ≈ <strong className="font-semibold">{calcularAguaDisponible(cc, pmp)} %</strong> (CC − PMP, calculado, no se almacena).
                    </p>
                  );
                })()}
              </div>
              {daCalc !== null && !Number.isNaN(daCalc) ? (
                <div className="grid gap-2 border border-neutral-200 p-3">
                  <p className="text-sm">
                    DA = <strong className="font-semibold">{daCalc} g/cm³</strong>
                    {poroCalc !== null && <> · Porosidad ≈ <strong className="font-semibold">{poroCalc} % ({interpretarPorosidad(poroCalc)})</strong></>}
                  </p>
                  {claseDensidad ? <SemaforoDensidad da={daCalc} clase={claseDensidad} /> : (
                    <p className="mensaje-info">Registra la textura para interpretar.</p>
                  )}
                  <div>
                    <button type="button" onClick={() => {
                      fijar('densidadAparente', daCalc);
                      if (poroCalc !== null) fijar('porosidadPct', poroCalc);
                    }} className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors">
                      Usar en la ficha
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Completa los datos para calcular.</p>
              )}
              {valores.densidadAparente !== undefined && claseDensidad && (
                <SemaforoDensidad da={valores.densidadAparente} clase={claseDensidad} />
              )}
              {poroLab !== null && !Number.isNaN(poroLab) && (
                <p className="text-xs text-neutral-500">
                  Porosidad derivada: {poroLab} % ({interpretarPorosidad(poroLab)}).
                  <button type="button" onClick={() => fijar('porosidadPct', poroLab)} className="ml-2 text-emerald-700 underline underline-offset-2">Usar</button>
                </p>
              )}
            </Columna>
          </>
        )}

        {indice === 3 && (
          <FisicasEstructura registro={registro} fijar={fijar} valores={valores} alFoto={alFoto} />
        )}

        {indice === 4 && (
          <>
            <Columna titulo="Resumen">
              <dl className="grid gap-1.5 text-sm">
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Textura</dt><dd className="font-medium">{valores.texturaTacto ?? (auto ? CLASES_ES[auto] : 'Sin registrar')}</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Color</dt><dd className="font-medium">{valores.munsellH ? `${valores.munsellH} ${valores.munsellV ?? '?'} / ${valores.munsellC ?? '?'}` : 'Sin registrar'}</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Densidad</dt><dd className="font-medium">{valores.densidadAparente !== undefined ? `${valores.densidadAparente} g/cm³` : 'Sin registrar'}</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Agua</dt><dd className="font-medium">{
                  valores.capacidadCampoPct !== undefined && valores.pmpPct !== undefined
                    ? `CC ${valores.capacidadCampoPct} % · PMP ${valores.pmpPct} % · disponible ≈ ${calcularAguaDisponible(valores.capacidadCampoPct, valores.pmpPct) ?? '?'} %`
                    : 'Sin registrar'
                }</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Estructura</dt><dd className="font-medium">{valores.estructuraVess !== undefined ? `VESS Sq${valores.estructuraVess}` : (valores.estructuraDesc ?? 'Sin registrar')}</dd></div>
              </dl>
            </Columna>
            <Columna titulo="Interpretación física">
              {valores.densidadAparente !== undefined && claseDensidad ? (
                <SemaforoDensidad da={valores.densidadAparente} clase={claseDensidad} />
              ) : (
                <p className="text-sm text-neutral-500">Registra densidad + textura para el semáforo, o continúa: la interpretación completa está en la pestaña Interpretación del wizard.</p>
              )}
              {valores.porosidadPct !== undefined && (
                <p className="text-sm">Porosidad: <strong className="font-semibold">{valores.porosidadPct} % ({interpretarPorosidad(valores.porosidadPct)})</strong></p>
              )}
              <Fuente texto={`${FUENTE_DENSIDAD}; ${FUENTE_POROSIDAD}`} />
            </Columna>
            <Columna titulo="Siguiente paso">
              <p className="text-sm text-neutral-600">Las conclusiones físicas alimentan la interpretación general de la ficha.</p>
              {alIrResumen && (
                <div>
                  <button type="button" onClick={alIrResumen} className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors">
                    Ir a Interpretación →
                  </button>
                </div>
              )}
            </Columna>
          </>
        )}
      </div>

      <DeckNavegacion diapositivas={DIAPOSITIVAS} indice={indice} alIr={irA} />
    </div>
  );
}
