import { useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaFichaSuelo, type FichaSueloFormulario } from '../esquemas/suelo';
import { RANGOS_VALIDADOS, semaforoPara, type Semaforo } from '../datos/rangos';
import { baseDatos } from '../base_datos/local';
import { Boton } from './ui/Boton';

type Paso = 'general' | 'fisicas' | 'quimicas' | 'biologicas' | 'resumen';

const PASOS: { id: Paso; titulo: string }[] = [
  { id: 'general', titulo: '1 · General' },
  { id: 'fisicas', titulo: '2 · Físicas' },
  { id: 'quimicas', titulo: '3 · Químicas' },
  { id: 'biologicas', titulo: '4 · Biológicas' },
  { id: 'resumen', titulo: '5 · Resumen' },
];

const INDICADORES_VSA = ['estructura', 'porosidad', 'color', 'lombrices', 'cobertura', 'erosion_visible'];

const OPCIONES = {
  tipoEvaluacion: [
    { valor: 'campo', texto: 'Campo (observación y equipo portátil)' },
    { valor: 'laboratorio', texto: 'Laboratorio (reporte)' },
    { valor: 'mixta', texto: 'Mixta (campo + laboratorio)' },
  ],
  texturaTacto: ['arenoso', 'franco arenoso', 'franco', 'franco limoso', 'franco arcilloso', 'arcilloso'],
  compactacion: ['suelto', 'friable', 'firme', 'compactado / hardpan'],
  infiltracion: ['rápida', 'moderada', 'lenta', 'encharca'],
  carbonatos: ['sin efervescencia', 'leve', 'fuerte'],
  nodulacion: ['sin nódulos', 'nódulos blancos (inactivos)', 'nódulos rosados (activos)'],
  olorSuelo: ['tierra fresca', 'neutro', 'putrefacción / azufre'],
  descomposicionMo: ['residuos frescos', 'parcialmente descompuestos', 'humus estable'],
} as const;

function Num({
  etiqueta, unidad, paso = '0.01', registro, nombre,
}: {
  etiqueta: string; unidad: string; paso?: string;
  registro: UseFormRegister<FichaSueloFormulario>; nombre: Parameters<UseFormRegister<FichaSueloFormulario>>[0];
}) {
  return (
    <div className="grid grid-cols-[1fr_7rem_4.5rem] items-center gap-2 border-b border-neutral-100 py-1.5">
      <span className="text-sm text-neutral-700">{etiqueta}</span>
      <input className="campo-entrada !min-h-[44px] !py-1.5" type="number" step={paso} min="0" aria-label={`${etiqueta} en ${unidad}`} {...registro(nombre)} />
      <span className="text-xs text-neutral-400">{unidad}</span>
    </div>
  );
}

function Sel({
  etiqueta, registro, nombre, opciones,
}: {
  etiqueta: string; registro: UseFormRegister<FichaSueloFormulario>;
  nombre: Parameters<UseFormRegister<FichaSueloFormulario>>[0];
  opciones: readonly (string | { readonly valor: string; readonly texto: string })[];
}) {
  return (
    <label className="etiqueta-campo">{etiqueta}
      <select className="campo-entrada" defaultValue="" {...registro(nombre)}>
        <option value="">— Sin registrar —</option>
        {opciones.map((o) => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
    </label>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-1">
      <legend className="text-xs font-semibold text-[#141414] bg-neutral-100 px-2 py-1 w-full">{titulo}</legend>
      {children}
    </fieldset>
  );
}

const COLOR_SEMAFORO: Record<Semaforo, string> = {
  bajo: 'bg-red-600',
  optimo: 'bg-[#1b5e20]',
  alto: 'bg-amber-500',
  'sin-dato': 'bg-neutral-300',
};

const TEXTO_SEMAFORO: Record<Semaforo, string> = {
  bajo: 'Bajo',
  optimo: 'Óptimo',
  alto: 'Alto',
  'sin-dato': 'Sin dato',
};

// Plan plan_fichas_suelo.md: wizard General → Físicas → Químicas → Biológicas → Resumen.
// El técnico llena lo disponible; la interpretación usa solo rangos validados.
export function FichaSueloWizard({ predioIdentificador }: { predioIdentificador: string }) {
  const [paso, setPaso] = useState<Paso>('general');
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [mensaje, setMensaje] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FichaSueloFormulario>({
    resolver: zodResolver(esquemaFichaSuelo),
    defaultValues: { predioIdentificador, fecha: new Date().toISOString().slice(0, 10), tipoEvaluacion: 'mixta' },
  });
  const valores = watch();

  const alGuardar = async (datos: FichaSueloFormulario) => {
    const existentes = await baseDatos.fichasSuelo.where('predioIdentificador').equals(datos.predioIdentificador).count();
    await baseDatos.fichasSuelo.add({ ...datos, version: existentes + 1, sincronizada: false });
    const tocados = INDICADORES_VSA.filter((i) => puntajes[i] !== undefined);
    if (tocados.length > 0) {
      const vals = INDICADORES_VSA.map((i) => puntajes[i] ?? 0);
      const indice = Math.round((vals.reduce((a, b) => a + b, 0) / (INDICADORES_VSA.length * 2)) * 100);
      await baseDatos.monitoreos.add({
        loteNombre: 'general', fecha: datos.fecha,
        indicadores: { vsa_indice: indice, ...puntajes }, observaciones: `VSA campo índice ${indice}/100`,
        sincronizada: false,
      });
    }
    setMensaje(`Ficha v${existentes + 1} guardada offline. Lo interpretado con rango validado aparece en Diagnóstico; lo demás queda registrado sin interpretar.`);
  };

  const conValor = RANGOS_VALIDADOS.filter((r) => {
    const v = valores[r.parametro as keyof FichaSueloFormulario];
    return typeof v === 'number' && !Number.isNaN(v);
  }).length;

  return (
    <form onSubmit={handleSubmit(alGuardar)} className="bg-white border border-neutral-200">
      <div className="flex gap-1.5 flex-wrap p-3 border-b border-neutral-200" role="tablist" aria-label="Pasos de caracterización">
        {PASOS.map((p) => (
          <button
            key={p.id} type="button" role="tab" aria-selected={paso === p.id}
            onClick={() => setPaso(p.id)}
            className={`boton-campo px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
              paso === p.id ? 'bg-[#1b5e20] text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-[#1b5e20]'
            }`}
          >
            {p.titulo}
          </button>
        ))}
      </div>

      <div className="p-5 grid gap-5">
        {paso === 'general' && (
          <Grupo titulo="Información general">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="etiqueta-campo">Fecha de muestreo
                <input className="campo-entrada" type="date" {...register('fecha')} />
              </label>
              <Sel etiqueta="Tipo de evaluación" registro={register} nombre="tipoEvaluacion" opciones={OPCIONES.tipoEvaluacion} />
              <label className="etiqueta-campo">Profundidad de muestreo (cm)
                <input className="campo-entrada" type="number" step="1" min="0" {...register('profundidadCm')} />
              </label>
              <label className="etiqueta-campo">Laboratorio / observador
                <input className="campo-entrada" placeholder="Ej: IGAC Tibaitatá / técnico campo" {...register('laboratorio')} />
              </label>
              <label className="etiqueta-campo sm:col-span-2">Condiciones climáticas recientes
                <input className="campo-entrada" placeholder="Ej: lluvias moderadas la última semana" {...register('climaReciente')} />
              </label>
            </div>
          </Grupo>
        )}

        {paso === 'fisicas' && (
          <>
            <Grupo titulo="Campo: observación y tacto">
              <div className="grid gap-4 sm:grid-cols-2">
                <Sel etiqueta="Textura al tacto (cinta / amasado)" registro={register} nombre="texturaTacto" opciones={OPCIONES.texturaTacto} />
                <Sel etiqueta="Compactación (cuchillo / varilla)" registro={register} nombre="compactacion" opciones={OPCIONES.compactacion} />
                <Sel etiqueta="Infiltración básica (anillo / PVC)" registro={register} nombre="infiltracion" opciones={OPCIONES.infiltracion} />
                <label className="etiqueta-campo">Estructura y terrones (DRES / VSA)
                  <input className="campo-entrada" placeholder="Ej: granular friable" {...register('estructuraDesc')} />
                </label>
                <label className="etiqueta-campo">Color Munsell (seco / húmedo)
                  <input className="campo-entrada" placeholder="Ej: 10YR 3/2 húmedo" {...register('colorMunsell')} />
                </label>
                <label className="etiqueta-campo">Profundidad efectiva (cm)
                  <input className="campo-entrada" type="number" step="1" min="0" {...register('profundidadEfectivaCm')} />
                </label>
              </div>
            </Grupo>
            <Grupo titulo="Laboratorio: granulometría y física">
              <Num etiqueta="Arena" unidad="%" paso="0.1" registro={register} nombre="arenaPct" />
              <Num etiqueta="Limo" unidad="%" paso="0.1" registro={register} nombre="limoPct" />
              <Num etiqueta="Arcilla" unidad="%" paso="0.1" registro={register} nombre="arcillaPct" />
              <Num etiqueta="Densidad aparente" unidad="g/cm³" registro={register} nombre="densidadAparente" />
              <Num etiqueta="Porosidad total" unidad="%" registro={register} nombre="porosidadPct" />
              <Num etiqueta="Capacidad de campo" unidad="%" registro={register} nombre="capacidadCampoPct" />
              <Num etiqueta="Punto de marchitez" unidad="%" registro={register} nombre="pmpPct" />
              {errors.arcillaPct && <p className="mensaje-error">{errors.arcillaPct.message}</p>}
            </Grupo>
          </>
        )}

        {paso === 'quimicas' && (
          <>
            <Grupo titulo="Campo: equipo portátil y observación">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="etiqueta-campo">pH portátil / tiras
                  <input className="campo-entrada" type="number" step="0.1" min="0" {...register('phCampo')} />
                </label>
                <label className="etiqueta-campo">CE portátil (dS/m)
                  <input className="campo-entrada" type="number" step="0.01" min="0" {...register('ceCampo')} />
                </label>
                <Sel etiqueta="Carbonatos (HCl / vinagre)" registro={register} nombre="carbonatos" opciones={OPCIONES.carbonatos} />
              </div>
              <label className="etiqueta-campo">Síntomas visuales en plantas (clorosis, necrosis)
                <input className="campo-entrada" placeholder="Ej: clorosis en hojas inferiores" {...register('sintomasVisuales')} />
              </label>
            </Grupo>
            <Grupo titulo="Laboratorio: acidez y salinidad">
              <Num etiqueta="pH en agua" unidad="—" registro={register} nombre="phAgua" />
              <Num etiqueta="pH en KCl" unidad="—" registro={register} nombre="phKcl" />
              <Num etiqueta="Conductividad eléctrica" unidad="dS/m" registro={register} nombre="conductividadDsM" />
            </Grupo>
            <Grupo titulo="Laboratorio: materia orgánica y nitrógeno">
              <Num etiqueta="Materia orgánica" unidad="%" registro={register} nombre="materiaOrganicaPct" />
              <Num etiqueta="Nitrógeno total" unidad="%" registro={register} nombre="nitrogenoPct" />
            </Grupo>
            <Grupo titulo="Laboratorio: bases, CIC y acidez">
              <Num etiqueta="Calcio" unidad="cmol/kg" registro={register} nombre="calcioCmolKg" />
              <Num etiqueta="Magnesio" unidad="cmol/kg" registro={register} nombre="magnesioCmolKg" />
              <Num etiqueta="Potasio" unidad="cmol/kg" registro={register} nombre="potasioCmolKg" />
              <Num etiqueta="Sodio" unidad="cmol/kg" registro={register} nombre="sodioCmolKg" />
              <Num etiqueta="CIC" unidad="cmol/kg" paso="0.1" registro={register} nombre="cicCmolKg" />
              <Num etiqueta="Aluminio" unidad="cmol/kg" registro={register} nombre="aluminioCmolKg" />
              <Num etiqueta="Saturación de Al" unidad="%" registro={register} nombre="saturacionAlPct" />
            </Grupo>
            <Grupo titulo="Laboratorio: fósforo, azufre y micros">
              <Num etiqueta="Fósforo disponible" unidad="mg/kg" paso="0.1" registro={register} nombre="fosforoMgKg" />
              <Num etiqueta="Azufre" unidad="mg/kg" paso="0.1" registro={register} nombre="azufreMgKg" />
              <Num etiqueta="Hierro" unidad="mg/kg" paso="0.1" registro={register} nombre="hierroMgKg" />
              <Num etiqueta="Manganeso" unidad="mg/kg" paso="0.1" registro={register} nombre="manganesoMgKg" />
              <Num etiqueta="Zinc" unidad="mg/kg" paso="0.1" registro={register} nombre="zincMgKg" />
              <Num etiqueta="Cobre" unidad="mg/kg" paso="0.1" registro={register} nombre="cobreMgKg" />
              <Num etiqueta="Boro" unidad="mg/kg" paso="0.1" registro={register} nombre="boroMgKg" />
            </Grupo>
          </>
        )}

        {paso === 'biologicas' && (
          <>
            <Grupo titulo="Campo: vida del suelo">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="etiqueta-campo">Lombrices (cubo 20×20×20 cm)
                  <input className="campo-entrada" type="number" step="1" min="0" {...register('lombricesConteo')} />
                </label>
                <Sel etiqueta="Nodulación en leguminosas" registro={register} nombre="nodulacion" opciones={OPCIONES.nodulacion} />
                <Sel etiqueta="Olor del suelo" registro={register} nombre="olorSuelo" opciones={OPCIONES.olorSuelo} />
                <Sel etiqueta="Descomposición de MO" registro={register} nombre="descomposicionMo" opciones={OPCIONES.descomposicionMo} />
              </div>
            </Grupo>
            <Grupo titulo="Campo: puntuación visual VSA (0 pobre · 1 moderado · 2 bueno)">
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
            </Grupo>
            <Grupo titulo="Laboratorio: biología">
              <Num etiqueta="Respiración basal" unidad="mg C-CO₂/kg/día" paso="0.1" registro={register} nombre="respiracionSuelo" />
              <Num etiqueta="Carbono biomasa microbiana" unidad="mg/kg" paso="0.1" registro={register} nombre="carbonoBiomasa" />
              <label className="etiqueta-campo">Colonización micorrízica
                <input className="campo-entrada" placeholder="Ej: 60 % raíces colonizadas" {...register('micorrizas')} />
              </label>
              <Num etiqueta="Cobertura vegetal" unidad="%" registro={register} nombre="coberturaVegetalPct" />
            </Grupo>
          </>
        )}

        {paso === 'resumen' && (
          <div className="grid gap-4">
            <div className="border-b border-neutral-200 pb-3">
              <h2 className="text-lg font-semibold text-[#141414]">Resumen e interpretación</h2>
              <p className="text-xs text-neutral-500">
                {conValor} de {RANGOS_VALIDADOS.length} parámetros con rango validado tienen dato.
                Solo esos se interpretan; el resto queda registrado sin interpretar.
              </p>
            </div>
            <ol className="grid gap-2">
              {RANGOS_VALIDADOS.map((r) => {
                const v = valores[r.parametro as keyof FichaSueloFormulario];
                const num = typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
                const sem = semaforoPara(r, num);
                return (
                  <li key={r.parametro} className="border border-neutral-200 px-4 py-2.5 grid gap-1">
                    <span className="flex items-center gap-2 text-sm">
                      <span className={`w-2.5 h-2.5 rounded-full ${COLOR_SEMAFORO[sem]}`} aria-hidden />
                      <strong className="font-semibold">{r.etiqueta}</strong>
                      <span className="text-neutral-500">{num !== undefined ? `${num} ${r.unidad}` : '—'} · {TEXTO_SEMAFORO[sem]}</span>
                    </span>
                    <details className="text-xs text-neutral-500">
                      <summary className="cursor-pointer text-[#1b5e20] font-medium">ⓘ Fuente del rango</summary>
                      <p className="mt-1">src/{r.fuente} · Óptimo {r.optimoMin}–{r.optimoMax} {r.unidad}</p>
                    </details>
                  </li>
                );
              })}
            </ol>
            <label className="etiqueta-campo">Referencia bibliográfica (src/) *
              <input
                className="campo-entrada"
                placeholder="Ej: guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.12-18"
                {...register('referenciaBibliografica')}
              />
            </label>
            {errors.referenciaBibliografica && <p className="mensaje-error">{errors.referenciaBibliografica.message}</p>}
            {mensaje && <p className="mensaje-ok">{mensaje}</p>}
            <div><Boton type="submit">Guardar ficha (offline)</Boton></div>
          </div>
        )}
      </div>
    </form>
  );
}
