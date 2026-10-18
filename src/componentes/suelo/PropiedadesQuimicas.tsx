import { useEffect, useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  RANGOS_VALIDADOS, semaforoPara, COLOR_SEMAFORO, TEXTO_SEMAFORO,
} from '../../datos/rangos';
import { GaugeArco } from '../GaugeArco';

function textoPh(ph: number | undefined): string {
  if (ph === undefined) return 'Registra el pH para ver el gauge';
  if (ph < 5.5) return 'Ácido · evalúa enmienda cal';
  if (ph < 6) return 'Moderadamente ácido';
  if (ph <= 7) return 'Óptimo general 6–7';
  return 'Alcalino · vigila micronutrientes';
}

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export const DIAPOSITIVAS_QUIMICAS: { id: string; titulo: string }[] = [
  { id: 'acidez', titulo: 'Acidez' },
  { id: 'salinidad', titulo: 'Salinidad' },
  { id: 'materia', titulo: 'MO y N' },
  { id: 'bases', titulo: 'Bases y CIC' },
  { id: 'fosforo', titulo: 'P y micros' },
  { id: 'conclusiones', titulo: 'Conclusiones' },
];

const DIAPOSITIVAS = DIAPOSITIVAS_QUIMICAS;

function Fuente({ texto }: { texto: string }) {
  return <p className="text-xs text-neutral-500">Fuente: {texto}</p>;
}

function Metodo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="border border-neutral-200 bg-neutral-50">
      <button
        type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}
        className="w-full flex items-center justify-between gap-2 p-2.5 text-left"
      >
        <span className="text-xs font-semibold text-emerald-700">Método · {titulo}</span>
        <span className={`text-neutral-400 transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`} aria-hidden>▾</span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${abierto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden"><div className="px-2.5 pb-2.5 grid gap-1.5 text-sm text-neutral-600">{children}</div></div>
      </div>
    </div>
  );
}

function Num({
  etiqueta, unidad, paso = '0.01', registro, nombre,
}: {
  etiqueta: string; unidad: string; paso?: string;
  registro: R; nombre: Parameters<R>[0];
}) {
  return (
    <div className="grid grid-cols-[1fr_7rem_4.5rem] items-center gap-2 border-b border-neutral-100 py-1.5">
      <span className="text-sm text-neutral-700">{etiqueta}</span>
      <input className="campo-entrada !min-h-[44px] !py-1.5" type="number" step={paso} min="0" aria-label={`${etiqueta} en ${unidad}`} {...registro(nombre)} />
      <span className="text-xs text-neutral-400">{unidad}</span>
    </div>
  );
}

function Semaforo({ parametro, valor }: { parametro: string; valor: number | undefined }) {
  const rango = RANGOS_VALIDADOS.find((r) => r.parametro === parametro);
  if (!rango) {
    return <span className="text-[11px] font-medium text-neutral-400">Solo registro</span>;
  }
  const sem = semaforoPara(rango, valor);
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
      <span className={`w-2 h-2 rounded-full ${COLOR_SEMAFORO[sem]}`} aria-hidden />
      {TEXTO_SEMAFORO[sem]}
      <details className="inline">
        <summary className="cursor-pointer text-emerald-700">ⓘ</summary>
      </details>
      <span className="sr-only">Fuente: {rango.fuente}</span>
    </span>
  );
}

function Fila({
  etiqueta, unidad, paso, registro, nombre, parametro, valor,
}: {
  etiqueta: string; unidad: string; paso?: string;
  registro: R; nombre: Parameters<R>[0];
  parametro: string; valor: number | undefined;
}) {
  return (
    <div className="grid grid-cols-[1fr_7rem_4.5rem] items-center gap-2 border-b border-neutral-100 py-1.5">
      <span className="text-sm text-neutral-700">{etiqueta}</span>
      <input className="campo-entrada !min-h-[44px] !py-1.5" type="number" step={paso ?? '0.01'} min="0" aria-label={`${etiqueta} en ${unidad}`} {...registro(nombre)} />
      <span className="text-xs text-neutral-400">{unidad}</span>
      <span className="col-span-3"><Semaforo parametro={parametro} valor={valor} /></span>
    </div>
  );
}

// Deck: una variable química por diapositiva, con método, captura,
// semáforo en vivo y conclusiones. Campo, laboratorio o mixto.
export function PropiedadesQuimicas({
  registro, valores, alIrResumen, diapositiva,
}: {
  registro: R; valores: V; alIrResumen?: () => void; diapositiva?: number | null;
}) {
  const [indice, setIndice] = useState(0);
  const irA = (i: number) => setIndice(Math.max(0, Math.min(DIAPOSITIVAS.length - 1, i)));
  useEffect(() => {
    if (diapositiva !== undefined && diapositiva !== null) irA(diapositiva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diapositiva]);
  const v = (c: keyof FichaSueloFormulario) => {
    const x = valores[c];
    return typeof x === 'number' && !Number.isNaN(x) ? x : undefined;
  };

  return (
    <div className="grid gap-3">
      <div key={indice} className="animacion-entrada bg-white border border-emerald-500/40 shadow-sm rounded-sm p-4 sm:p-5 grid gap-4 content-start">
        {indice === 0 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Acidez</h3>
              <p className="text-xs text-neutral-500">El pH gobierna la disponibilidad de nutrientes (óptimo general 6–7).</p>
            </div>
            <Metodo titulo="Potenciómetro (SENA La Granja, práctica 4)">
              <p>20 g de suelo tamizado a 2 mm + 20 ml de agua destilada, agita, reposa 30 min y mide con electrodo calibrado (buffers pH 7 y 4). Lava el electrodo entre mediciones.</p>
              <p>Fuente: SENA La Granja, Manual de Prácticas (2013).</p>
            </Metodo>
            <Fila etiqueta="pH en agua" unidad="—" registro={registro} nombre="phAgua" parametro="phAgua" valor={v('phAgua')} />
            <Fila etiqueta="pH en KCl" unidad="—" registro={registro} nombre="phKcl" parametro="phKcl" valor={v('phKcl')} />
            <Fila etiqueta="pH portátil / tiras" unidad="—" registro={registro} nombre="phCampo" parametro="phCampo" valor={v('phCampo')} />
            <div className="bg-selva rounded-sm p-4">
              <GaugeArco
                valor={v('phAgua') ?? v('phCampo')}
                minimo={0}
                maximo={14}
                titulo="pH ACTUAL"
                subtexto={textoPh(v('phAgua') ?? v('phCampo'))}
                gradiente
              />
            </div>
            <p className="mensaje-info">El pH se registra sin semáforo: su interpretación depende del cultivo (tabla de pH óptimo por cultivo en el manual de referencia).</p>
            <Fuente texto="SENA La Granja (2013); USDA-NRCS, Soil Survey Manual" />
          </>
        )}

        {indice === 1 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Salinidad</h3>
              <p className="text-xs text-neutral-500">Sales solubles: frenan agua y nutrientes si se acumulan.</p>
            </div>
            <Metodo titulo="Conductímetro">
              <p>Equipo portátil calibrado en campo o extracto en laboratorio. Registra siempre el método junto al valor.</p>
              <p>Fuente: USDA-NRCS, Soil Survey Manual.</p>
            </Metodo>
            <Fila etiqueta="CE laboratorio" unidad="dS/m" registro={registro} nombre="conductividadDsM" parametro="conductividadDsM" valor={v('conductividadDsM')} />
            <Fila etiqueta="CE portátil" unidad="dS/m" registro={registro} nombre="ceCampo" parametro="ceCampo" valor={v('ceCampo')} />
            <Fuente texto="Guía de calidad y salud del suelo (rango 0–2 dS/m)" />
          </>
        )}

        {indice === 2 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Materia orgánica y nitrógeno</h3>
              <p className="text-xs text-neutral-500">La reserva de fertilidad y vida del suelo.</p>
            </div>
            <Metodo titulo="Walkley-Black y N total (SENA La Granja, práctica 15)">
              <p>MO por titulación con dicromato (suelos agrícolas productivos: 3–6 %). El N se lee junto a la MO por su vínculo directo.</p>
              <p>Fuente: SENA La Granja (2013); manual de agroecología (N).</p>
            </Metodo>
            <Fila etiqueta="Materia orgánica" unidad="%" registro={registro} nombre="materiaOrganicaPct" parametro="materiaOrganicaPct" valor={v('materiaOrganicaPct')} />
            <Fila etiqueta="Nitrógeno total" unidad="%" registro={registro} nombre="nitrogenoPct" parametro="nitrogenoPct" valor={v('nitrogenoPct')} />
            <div className="bg-selva rounded-sm p-4">
              <GaugeArco
                valor={v('materiaOrganicaPct')}
                minimo={0}
                maximo={10}
                titulo="MATERIA ORGÁNICA"
                subtexto={
                  v('materiaOrganicaPct') === undefined ? 'Registra la MO para ver el gauge'
                  : v('materiaOrganicaPct')! < 3 ? 'Baja · aporta compost y cobertura'
                  : v('materiaOrganicaPct')! <= 6 ? 'Adecuada 3–6 %'
                  : 'Alta · excelente reserva'
                }
              />
            </div>
            <Fuente texto="Guía de calidad y salud del suelo (MO); manual de agroecología (N)" />
          </>
        )}

        {indice === 3 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Bases, CIC y acidez</h3>
              <p className="text-xs text-neutral-500">Cationes retenidos y capacidad de intercambio del suelo.</p>
            </div>
            <Metodo titulo="Acetato de amonio + absorción atómica (SENA La Granja, prácticas 12 y 14)">
              <p>Bases (Ca, Mg, K, Na) extraídas con acetato de amonio 1M pH 7; CIC por saturación y titulación. Saturación de bases = Σ bases ÷ CIC × 100.</p>
              <p>Fuente: SENA La Granja (2013).</p>
            </Metodo>
            <Fila etiqueta="Calcio" unidad="cmol/kg" registro={registro} nombre="calcioCmolKg" parametro="calcioCmolKg" valor={v('calcioCmolKg')} />
            <Fila etiqueta="Magnesio" unidad="cmol/kg" registro={registro} nombre="magnesioCmolKg" parametro="magnesioCmolKg" valor={v('magnesioCmolKg')} />
            <Fila etiqueta="Potasio" unidad="cmol/kg" registro={registro} nombre="potasioCmolKg" parametro="potasioCmolKg" valor={v('potasioCmolKg')} />
            <Fila etiqueta="Sodio" unidad="cmol/kg" registro={registro} nombre="sodioCmolKg" parametro="sodioCmolKg" valor={v('sodioCmolKg')} />
            <Fila etiqueta="CIC" unidad="cmol/kg" paso="0.1" registro={registro} nombre="cicCmolKg" parametro="cicCmolKg" valor={v('cicCmolKg')} />
            <Fila etiqueta="Aluminio" unidad="cmol/kg" registro={registro} nombre="aluminioCmolKg" parametro="aluminioCmolKg" valor={v('aluminioCmolKg')} />
            <Fila etiqueta="Saturación de Al" unidad="%" registro={registro} nombre="saturacionAlPct" parametro="saturacionAlPct" valor={v('saturacionAlPct')} />
            <Fuente texto="Guías de calidad del suelo y buenas prácticas (Ca, Mg, K); resto solo registro" />
          </>
        )}

        {indice === 4 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Fósforo, azufre y micros</h3>
              <p className="text-xs text-neutral-500">Disponibilidad y elementos traza del reporte.</p>
            </div>
            <Metodo titulo="Doble ácido + absorción atómica (SENA La Granja, práctica 13)">
              <p>Micronutrientes extraídos con HCl + H₂SO₄ (método Carolina del Norte), lectura en absorción atómica. Reporta siempre el extractante (Bray II / Olsen para P).</p>
              <p>Fuente: SENA La Granja (2013).</p>
            </Metodo>
            <Fila etiqueta="Fósforo disponible" unidad="mg/kg" paso="0.1" registro={registro} nombre="fosforoMgKg" parametro="fosforoMgKg" valor={v('fosforoMgKg')} />
            <label className="etiqueta-campo">Método extractante P
              <select className="campo-entrada" defaultValue="" {...registro('metodoFosforo')}>
                <option value="">— Sin registrar —</option>
                <option value="Bray II">Bray II</option>
                <option value="Olsen">Olsen</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            <Fila etiqueta="Azufre" unidad="mg/kg" paso="0.1" registro={registro} nombre="azufreMgKg" parametro="azufreMgKg" valor={v('azufreMgKg')} />
            <Fila etiqueta="Hierro" unidad="mg/kg" paso="0.1" registro={registro} nombre="hierroMgKg" parametro="hierroMgKg" valor={v('hierroMgKg')} />
            <Fila etiqueta="Manganeso" unidad="mg/kg" paso="0.1" registro={registro} nombre="manganesoMgKg" parametro="manganesoMgKg" valor={v('manganesoMgKg')} />
            <Fila etiqueta="Zinc" unidad="mg/kg" paso="0.1" registro={registro} nombre="zincMgKg" parametro="zincMgKg" valor={v('zincMgKg')} />
            <Fila etiqueta="Cobre" unidad="mg/kg" paso="0.1" registro={registro} nombre="cobreMgKg" parametro="cobreMgKg" valor={v('cobreMgKg')} />
            <Fila etiqueta="Boro" unidad="mg/kg" paso="0.1" registro={registro} nombre="boroMgKg" parametro="boroMgKg" valor={v('boroMgKg')} />
            <label className="etiqueta-campo">Síntomas visuales en plantas (clorosis, necrosis)
              <input className="campo-entrada" placeholder="Ej: clorosis en hojas inferiores" {...registro('sintomasVisuales')} />
            </label>
            <label className="etiqueta-campo">Carbonatos (HCl / vinagre)
              <select className="campo-entrada" defaultValue="" {...registro('carbonatos')}>
                <option value="">— Sin registrar —</option>
                <option value="sin efervescencia">Sin efervescencia</option>
                <option value="leve">Leve</option>
                <option value="fuerte">Fuerte</option>
              </select>
            </label>
            <Fuente texto="Guía de buenas prácticas (P); resto solo registro" />
          </>
        )}

        {indice === 5 && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-humus">Conclusiones químicas</h3>
              <p className="text-xs text-neutral-500">Lo registrado en este recorrido, listo para la interpretación.</p>
            </div>
            <dl className="grid gap-1.5 text-sm border border-neutral-200 p-4">
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Acidez</dt><dd className="font-medium">{v('phAgua') !== undefined ? `pH ${v('phAgua')}` : '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Salinidad</dt><dd className="font-medium">{v('conductividadDsM') !== undefined ? `${v('conductividadDsM')} dS/m` : '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">MO / N</dt><dd className="font-medium">{v('materiaOrganicaPct') !== undefined ? `${v('materiaOrganicaPct')} %` : '—'} / {v('nitrogenoPct') !== undefined ? `${v('nitrogenoPct')} %` : '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Bases</dt><dd className="font-medium">Ca {v('calcioCmolKg') ?? '—'} · Mg {v('magnesioCmolKg') ?? '—'} · K {v('potasioCmolKg') ?? '—'} cmol/kg</dd></div>
              <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Fósforo</dt><dd className="font-medium">{v('fosforoMgKg') !== undefined ? `${v('fosforoMgKg')} mg/kg` : '—'}</dd></div>
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
    </div>
  );
}