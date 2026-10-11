import { useEffect, useRef, useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../esquemas/suelo';
import type { FotoLista } from '../servicios/fotos';
import { CapturaFoto } from './CapturaFoto';
import {
  CLASES_ES, clasificarTextura, NIVELES_VESS, FUENTE_VESS,
  MUNSELL_TONOS, munsellChip, ADVERTENCIA_MUNSELL, FUENTE_MUNSELL,
  MINERALES_MUNSELL, FUENTE_MINERALES,
  DENSIDAD_NRCS, FUENTE_DENSIDAD, calcularDA, calcularPorosidad,
  interpretarDensidad, interpretarPorosidad, FUENTE_POROSIDAD,
  type ClaseTextural,
} from '../datos/fisicas';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

const COMPACTACION = ['suelto', 'friable', 'firme', 'compactado / hardpan'];
const INFILTRACION = ['rápida', 'moderada', 'lenta', 'encharca'];

const DIAPOSITIVAS = [
  { id: 'textura', titulo: 'Textura' },
  { id: 'color', titulo: 'Color' },
  { id: 'densidad', titulo: 'Densidad' },
  { id: 'estructura', titulo: 'Estructura' },
  { id: 'manejo', titulo: 'Manejo' },
  { id: 'conclusiones', titulo: 'Conclusiones' },
];

function Fuente({ texto }: { texto: string }) {
  return <p className="text-xs text-neutral-500">Fuente: {texto}</p>;
}

function Columna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-200 bg-white p-4 grid gap-3 content-start">
      <h4 className="text-xs font-semibold tracking-wide text-[#1b5e20] uppercase">{titulo}</h4>
      {children}
    </div>
  );
}

// Árbol FAO 3 pasos: bola → cinta → tacto (aproximación de campo).
function ArbolTextura({ alElegir }: { alElegir: (clase: string) => void }) {
  const [paso, setPaso] = useState(1);
  const [cinta, setCinta] = useState('');
  if (paso === 1) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-medium">1 · Humedece y aprieta: ¿forma bola que no se deshace?</p>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#1b5e20]" onClick={() => setPaso(2)}>Sí forma bola</button>
          <button type="button" className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#1b5e20]" onClick={() => alElegir('Arenoso (arena / arena franca)')}>No, se desmorona</button>
        </div>
      </div>
    );
  }
  if (paso === 2) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-medium">2 · Presiona entre pulgar e índice: ¿forma cinta?</p>
        <div className="flex gap-2 flex-wrap">
          {[['no', 'No forma cinta'], ['corta', 'Cinta corta (< 2,5 cm)'], ['larga', 'Cinta larga (> 2,5 cm)']].map(([v, t]) => (
            <button
              key={v} type="button"
              className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#1b5e20]"
              onClick={() => { if (v === 'no') { alElegir('Franco (franco arenoso / limoso: define al tacto)'); } else { setCinta(v); setPaso(3); } }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">3 · Frota la cinta: ¿cómo se siente?</p>
      <div className="flex gap-2 flex-wrap">
        {[
          ['áspera', cinta === 'larga' ? 'Arcillo arenoso' : 'Franco arcillo arenoso'],
          ['suave', cinta === 'larga' ? 'Franco arcilloso / limoso' : 'Franco arcilloso'],
          ['jabonosa', 'Arcilloso (posible esmectita 2:1)'],
        ].map(([t, r]) => (
          <button
            key={t} type="button"
            className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#1b5e20]"
            onClick={() => alElegir(r)}
          >
            {t}
          </button>
        ))}
      </div>
      <button type="button" className="text-xs text-[#1b5e20] underline underline-offset-2 w-fit" onClick={() => setPaso(1)}>Reiniciar árbol</button>
    </div>
  );
}

function Triangulo({ arena, limo, arcilla, clase }: { arena: number; limo: number; arcilla: number; clase: string }) {
  const x = 8 + ((arena + limo / 2) / 100) * 184;
  const y = 165 - (arcilla / 100) * 157;
  return (
    <figure className="grid gap-1">
      <svg viewBox="0 0 200 180" className="w-full max-w-[260px]" role="img" aria-label={`Triángulo textural USDA: ${clase}`}>
        <polygon points="100,8 8,165 192,165" fill="#f5f5f4" stroke="#1b5e20" strokeWidth="2" />
        <text x="100" y="14" textAnchor="middle" fontSize="9" fill="#525252">Arcilla</text>
        <text x="14" y="176" fontSize="9" fill="#525252">Arena</text>
        <text x="186" y="176" textAnchor="end" fontSize="9" fill="#525252">Limo</text>
        <circle cx={x} cy={y} r="5" fill="#1b5e20" stroke="#fff" strokeWidth="2" />
      </svg>
      <figcaption className="text-xs text-neutral-500">Punto según tu granulometría: {clase}</figcaption>
    </figure>
  );
}

function tactoAClase(tacto: string): ClaseTextural | null {
  const t = tacto.toLowerCase();
  if (t.includes('arcillo arenoso')) return 'arcillo-arenoso';
  if (t.includes('franco arcillo arenoso')) return 'franco-arcillo-arenoso';
  if (t.includes('franco arcilloso')) return 'franco-arcilloso';
  if (t.includes('arcilloso') || t.includes('arcilla')) return 'arcilla';
  if (t.includes('limoso')) return 'franco-limoso';
  if (t.includes('franco arenoso')) return 'franco-arenoso';
  if (t.includes('arenoso') || t.includes('arena')) return 'arena';
  if (t.includes('franco')) return 'franco';
  return null;
}

function SemaforoDensidad({ da, clase }: { da: number; clase: ClaseTextural }) {
  const estado = interpretarDensidad(da, clase);
  const u = DENSIDAD_NRCS[clase];
  return (
    <p className={`text-sm font-medium ${estado === 'optimo' ? 'text-[#1b5e20]' : estado === 'vigilar' ? 'text-amber-600' : 'text-red-700'}`}>
      {estado === 'optimo' ? '✓ Óptima' : estado === 'vigilar' ? '● Vigilar' : '✕ Restringe raíces'} para {CLASES_ES[clase]} (ideal &lt; {u.idealMax} · restringe &gt; {u.restringeMin} g/cm³)
    </p>
  );
}

// Deck estilo curso/MOOC: una variable por diapositiva con fundamentos,
// medición y captura DUO (campo + laboratorio), hasta conclusiones.
export function PropiedadesFisicas({
  registro, fijar, valores, errorGranulometria, alFoto, alIrResumen, contexto,
}: {
  registro: R; fijar: UseFormSetValue<FichaSueloFormulario>; valores: V; errorGranulometria?: string;
  alFoto?: (f: FotoLista) => void; alIrResumen?: () => void; contexto?: string;
}) {
  const [indice, setIndice] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const barraRef = useRef<HTMLDivElement>(null);
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
    barraRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [indice]);

  return (
    <div className="grid gap-3">
      {contexto && (
        <p className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]" aria-hidden />
          Trabajando en: {contexto}
        </p>
      )}

      <div ref={barraRef} className="bg-[#1b5e20] text-white rounded-sm px-4 py-3 flex flex-wrap items-center justify-between gap-2 scroll-mt-28">
        <p className="text-[11px] font-medium tracking-wide text-white/70">Módulo · Propiedades físicas</p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold bg-white/15 rounded-full px-3 py-1">Variable · {DIAPOSITIVAS[indice].titulo}</span>
          <span className="text-[11px] text-white/60">{indice + 1} de {DIAPOSITIVAS.length}</span>
        </div>
      </div>

      <div key={indice} className="animacion-entrada bg-white border-2 border-[#1b5e20]/30 rounded-sm p-5 grid gap-3 lg:grid-cols-3 max-h-[calc(100vh-240px)] min-h-[320px] overflow-y-auto scroll-sutil content-start">
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
                <summary className="cursor-pointer text-xs font-medium text-[#1b5e20] p-2.5">Tabla mineral → Munsell → color</summary>
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
                <div className="grid grid-cols-3 gap-2">
                  <label className="etiqueta-campo">Porosidad
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('porosidadPct')} />
                  </label>
                  <label className="etiqueta-campo">CC
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('capacidadCampoPct')} />
                  </label>
                  <label className="etiqueta-campo">PMP
                    <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('pmpPct')} />
                  </label>
                </div>
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
                    }} className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#1b5e20] text-white hover:bg-[#124116] transition-colors">
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
                  <button type="button" onClick={() => fijar('porosidadPct', poroLab)} className="ml-2 text-[#1b5e20] underline underline-offset-2">Usar</button>
                </p>
              )}
            </Columna>
          </>
        )}

        {indice === 3 && (
          <>
            <Columna titulo="Fundamentos">
              <p className="text-sm text-neutral-600">El arreglo de agregados y poros regula agua, aire y raíces. VESS puntúa de Sq1 (friable) a Sq5 (macizo).</p>
              <img src="/imagenes/3.jpg" alt="Agregados, raíces y poros del suelo en primer plano" loading="lazy" className="w-full max-w-[220px] rounded-sm" />
              <Fuente texto={FUENTE_VESS} />
            </Columna>
            <Columna titulo="Medición">
              <p className="text-sm font-medium">Extrae un bloque de 20 cm sin pisar el borde, ábrelo como un libro y observa terrones, poros y raíces por capa. Puntúa cada capa y promedia por espesor.</p>
              {alFoto && (
                <div>
                  <CapturaFoto texto="Foto del bloque VESS" tipo="vess" alCapturar={alFoto} />
                  <p className="text-[11px] text-neutral-400 mt-1">Se guarda con la ficha al presionar Guardar.</p>
                </div>
              )}
            </Columna>
            <Columna titulo="Captura DUO">
              <div className="grid gap-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-3">
                {NIVELES_VESS.map((n) => (
                  <button
                    key={n.sq} type="button"
                    onClick={() => { fijar('estructuraVess', n.sq); fijar('estructuraDesc', `VESS Sq${n.sq}`); }}
                    aria-pressed={valores.estructuraVess === n.sq}
                    className={`boton-campo p-3 rounded-sm border text-left transition-colors ${
                      valores.estructuraVess === n.sq
                        ? 'bg-[#1b5e20] text-white border-[#1b5e20]'
                        : 'bg-white border-neutral-300 hover:border-[#1b5e20]'
                    }`}
                  >
                    <span className="block text-2xl font-semibold">Sq{n.sq}</span>
                    <span className="block text-xs font-medium">{n.titulo.split('·')[1]}</span>
                  </button>
                ))}
              </div>
              {valores.estructuraVess !== undefined && (
                <p className="mensaje-ok">
                  {NIVELES_VESS.find((n) => n.sq === valores.estructuraVess)?.titulo}:{' '}
                  {NIVELES_VESS.find((n) => n.sq === valores.estructuraVess)?.descripcion}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="etiqueta-campo">Compactación
                  <select className="campo-entrada" defaultValue="" {...registro('compactacion')}>
                    <option value="">— Sin registrar —</option>
                    {COMPACTACION.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="etiqueta-campo">Infiltración
                  <select className="campo-entrada" defaultValue="" {...registro('infiltracion')}>
                    <option value="">— Sin registrar —</option>
                    {INFILTRACION.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="etiqueta-campo">Prof. efectiva (cm)
                  <input className="campo-entrada" type="number" step="1" min="0" {...registro('profundidadEfectivaCm')} />
                </label>
                <label className="etiqueta-campo">Notas libres
                  <input className="campo-entrada" placeholder="Ej: granular friable" {...registro('estructuraDesc')} />
                </label>
              </div>
            </Columna>
          </>
        )}

        {indice === 4 && (
          <>
            <Columna titulo="Resumen">
              <dl className="grid gap-1.5 text-sm">
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Textura</dt><dd className="font-medium">{valores.texturaTacto ?? (auto ? CLASES_ES[auto] : 'Sin registrar')}</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Color</dt><dd className="font-medium">{valores.munsellH ? `${valores.munsellH} ${valores.munsellV ?? '?'} / ${valores.munsellC ?? '?'}` : 'Sin registrar'}</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Densidad</dt><dd className="font-medium">{valores.densidadAparente !== undefined ? `${valores.densidadAparente} g/cm³` : 'Sin registrar'}</dd></div>
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
                  <button type="button" onClick={alIrResumen} className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#1b5e20] text-white hover:bg-[#124116] transition-colors">
                    Ir a Interpretación →
                  </button>
                </div>
              )}
            </Columna>
          </>
        )}
      </div>

      <nav className="sticky bottom-2 z-10 mx-auto w-full max-w-[240px] bg-[#141414]/95 backdrop-blur text-white rounded-full px-2 py-1 grid gap-1 shadow-lg" aria-label="Navegación de diapositivas">
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            className="w-8 h-8 grid place-items-center text-sm hover:bg-white/10 rounded-full transition-colors"
            aria-label="Diapositiva anterior"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="px-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors h-8"
            aria-expanded={menuAbierto}
            aria-label="Menú de variables"
          >
            ▦
          </button>
          <button
            type="button"
            onClick={() => irA(indice + 1)}
            className="w-8 h-8 grid place-items-center text-sm hover:bg-white/10 rounded-full transition-colors"
            aria-label="Diapositiva siguiente"
          >
            →
          </button>
        </div>
        {menuAbierto && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 animacion-entrada" role="tablist" aria-label="Menú de variables">
            {DIAPOSITIVAS.map((s, i) => (
              <button
                key={s.id} type="button" role="tab" aria-selected={indice === i}
                onClick={() => { irA(i); setMenuAbierto(false); }}
                className={`boton-campo px-2 py-2 text-xs font-semibold rounded-sm transition-colors ${
                  indice === i ? 'bg-[#1b5e20] text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {i + 1} · {s.titulo}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-1" aria-hidden={!menuAbierto}>
          {DIAPOSITIVAS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${indice === i ? 'w-5 bg-[#86efac]' : 'w-1.5 bg-white/30'}`}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
