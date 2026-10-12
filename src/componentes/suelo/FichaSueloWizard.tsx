import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaFichaSuelo, type FichaSueloFormulario } from '../../esquemas/suelo';
import { RANGOS_VALIDADOS, semaforoPara, type Semaforo } from '../../datos/rangos';
import { PropiedadesFisicas } from './PropiedadesFisicas';
import { PropiedadesQuimicas } from './PropiedadesQuimicas';
import { PropiedadesBiologicas } from './PropiedadesBiologicas';
import { blobAUrl, coberturaVerde, type FotoLista } from '../../servicios/fotos';
import { baseDatos } from '../../base_datos/local';
import { Boton } from '../ui/Boton';

type Paso = 'general' | 'fisicas' | 'quimicas' | 'biologicas' | 'resumen';

const PASOS: { id: Paso; titulo: string }[] = [
  { id: 'general', titulo: 'Datos del terreno' },
  { id: 'fisicas', titulo: 'Propiedades físicas' },
  { id: 'quimicas', titulo: 'Propiedades químicas' },
  { id: 'biologicas', titulo: 'Propiedades biológicas' },
  { id: 'resumen', titulo: 'Interpretación' },
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
      <legend className="text-xs font-semibold text-humus bg-neutral-100 px-2 py-1 w-full">{titulo}</legend>
      {children}
    </fieldset>
  );
}

const COLOR_SEMAFORO: Record<Semaforo, string> = {
  bajo: 'bg-red-600',
  optimo: 'bg-[#14736E]',
  alto: 'bg-amber-500',
  'sin-dato': 'bg-neutral-300',
};

const TEXTO_SEMAFORO: Record<Semaforo, string> = {
  bajo: 'Bajo',
  optimo: 'Óptimo',
  alto: 'Alto',
  'sin-dato': 'Sin dato',
};

// Campos que alimentan la barra de avance del wizard.
const CAMPOS_AVANCE: (keyof FichaSueloFormulario)[] = [
  'fecha', 'tipoEvaluacion', 'profundidadCm', 'climaReciente',
  'texturaTacto', 'estructuraDesc', 'colorMunsell', 'profundidadEfectivaCm',
  'arenaPct', 'limoPct', 'arcillaPct', 'densidadAparente',
  'phAgua', 'conductividadDsM', 'materiaOrganicaPct', 'nitrogenoPct',
  'calcioCmolKg', 'magnesioCmolKg', 'potasioCmolKg', 'fosforoMgKg',
  'lombricesConteo', 'olorSuelo', 'respiracionSuelo',
];

// Wizard de caracterización: General → Físicas → Químicas → Biológicas → Resumen.
// El técnico llena lo disponible; la interpretación usa solo rangos validados.
export function FichaSueloWizard({ predioIdentificador }: { predioIdentificador: string }) {
  const [paso, setPaso] = useState<Paso>('general');
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [mensaje, setMensaje] = useState('');
  const [fotosEtapa, setFotosEtapa] = useState<FotoLista[]>([]);
  const [fotoCobertura, setFotoCobertura] = useState<{ url: string; pct: number } | null>(null);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FichaSueloFormulario>({
    resolver: zodResolver(esquemaFichaSuelo),
    defaultValues: { predioIdentificador, fecha: new Date().toISOString().slice(0, 10), tipoEvaluacion: 'mixta' },
  });
  const valores = watch();

  const alGuardar = async (datos: FichaSueloFormulario) => {
    const existentes = await baseDatos.fichasSuelo.where('predioIdentificador').equals(datos.predioIdentificador).count();
    const fichaId = await baseDatos.fichasSuelo.add({ ...datos, version: existentes + 1, sincronizada: false });
    for (const f of fotosEtapa) {
      await baseDatos.fotos.add({
        fichaId, predioIdentificador: datos.predioIdentificador,
        tipo: f.tipo, foto: f.blob, miniatura: f.miniatura,
        lat: f.lat, lng: f.lng, coberturaPct: f.coberturaPct,
        fecha: datos.fecha, sincronizada: false,
      });
    }
    setFotosEtapa([]);
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

  const avance = Math.round(
    (CAMPOS_AVANCE.filter((c) => {
      const v = valores[c];
      return v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v));
    }).length / CAMPOS_AVANCE.length) * 100
  );
  const urlsFotos = useMemo(() => {
    const urls = fotosEtapa.map((f) => blobAUrl(f.miniatura));
    return urls;
  }, [fotosEtapa]);
  useEffect(() => () => { urlsFotos.forEach((u) => URL.revokeObjectURL(u)); }, [urlsFotos]);

  return (
    <form onSubmit={handleSubmit(alGuardar)} className="bg-white border border-neutral-200">
      <div className="border-2 border-[#059669] rounded-sm overflow-hidden">
      <div className="scroll-sutil flex flex-nowrap gap-1.5 overflow-x-auto p-3 border-b border-neutral-200 bg-green-50/50" role="tablist" aria-label="Pasos de caracterización">
        {PASOS.map((p) => (
          <button
            key={p.id} type="button" role="tab" aria-selected={paso === p.id}
            onClick={() => setPaso(p.id)}
            className={`boton-campo shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
              paso === p.id ? 'bg-[#059669] text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-[#059669]'
            }`}
          >
            {p.titulo}
          </button>
        ))}
      </div>

      <div className="px-3 pb-3 border-b border-neutral-200 grid gap-1.5" aria-hidden={false}>
        <div className="flex justify-between text-[11px] font-medium text-neutral-500">
          <span>Avance de la ficha</span>
          <span>{avance} %</span>
        </div>
        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de la ficha">
            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${avance}%`, background: 'var(--acento)' }} />
        </div>
      </div>

      <div key={paso} className="animacion-entrada p-5 grid gap-5">
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
          <PropiedadesFisicas registro={register} fijar={setValue} valores={valores} errorGranulometria={errors.arcillaPct?.message} alFoto={(f) => setFotosEtapa((v) => [...v, f])} alIrResumen={() => setPaso('resumen')} contexto={predioIdentificador} />
        )}

        {paso === 'quimicas' && (
          <PropiedadesQuimicas registro={register} valores={valores} alIrResumen={() => setPaso('resumen')} contexto={predioIdentificador} />
        )}

        {paso === 'biologicas' && (
          <PropiedadesBiologicas
            registro={register}
            valores={valores}
            puntajes={puntajes}
            setPuntajes={setPuntajes}
            fotoCobertura={fotoCobertura}
            alFotoCobertura={async (f) => {
              const pct = await coberturaVerde(f.blob);
              setFotoCobertura({ url: blobAUrl(f.miniatura), pct });
              setFotosEtapa((v) => [...v.filter((x) => x.tipo !== 'cobertura'), { ...f, coberturaPct: pct }]);
            }}
            alUsarCobertura={(pct) => setValue('coberturaVegetalPct', pct)}
            alIrResumen={() => setPaso('resumen')}
            contexto={predioIdentificador}
          />
        )}

        {paso === 'resumen' && (
          <div className="grid gap-4">
            <div className="border-b border-neutral-200 pb-3">
              <h2 className="text-lg font-semibold text-humus">Resumen e interpretación</h2>
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
                  <li key={r.parametro} className="border border-neutral-200 px-4 py-2.5 grid gap-1.5">
                    <span className="flex items-center gap-2 text-sm">
                      <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${COLOR_SEMAFORO[sem]}`} aria-hidden />
                      <strong className="font-semibold">{r.etiqueta}</strong>
                      <span className="text-neutral-500">{num !== undefined ? `${num} ${r.unidad}` : '—'} · {TEXTO_SEMAFORO[sem]}</span>
                    </span>
                    {num !== undefined && (() => {
                      const max = r.optimoMax * 1.5 || 1;
                      const pct = (v: number) => Math.max(0, Math.min(100, (v / max) * 100));
                      return (
                        <span className="relative block h-1.5 rounded-full bg-neutral-100" aria-hidden>
                          <span
                            className="absolute inset-y-0 transition-all duration-500"
                            style={{ left: `${pct(r.optimoMin)}%`, width: `${Math.max(0, pct(r.optimoMax) - pct(r.optimoMin))}%`, background: 'var(--acento)', opacity: 0.35 }}
                          />
                          <span
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow transition-all duration-500"
                            style={{ left: `${pct(num)}%`, background: sem === 'optimo' ? '#14736E' : sem === 'bajo' ? '#dc2626' : '#f59e0b' }}
                          />
                        </span>
                      );
                    })()}
                    <details className="text-xs text-neutral-500">
                      <summary className="cursor-pointer text-emerald-700 font-medium">ⓘ Fuente del rango</summary>
                      <p className="mt-1">src/{r.fuente} · Óptimo {r.optimoMin}–{r.optimoMax} {r.unidad}</p>
                    </details>
                  </li>
                );
              })}
            </ol>
            {fotosEtapa.length > 0 && (
              <div className="grid gap-2">
                <h4 className="text-sm font-semibold text-humus">Fotos por guardar ({fotosEtapa.length})</h4>
                <div className="flex gap-2 flex-wrap">
                  {fotosEtapa.map((f, i) => (
                    <span key={i} className="relative inline-block">
                      <img src={urlsFotos[i]} alt={`Foto ${f.tipo}`} className="w-16 h-16 object-cover rounded-sm border border-neutral-200" />
                      <button
                        type="button" aria-label="Quitar foto"
                        onClick={() => setFotosEtapa((v) => v.filter((_, j) => j !== i))}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-selva text-white text-xs grid place-items-center"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <label className="etiqueta-campo">Referencia (opcional)
              <input
                className="campo-entrada"
                placeholder="Ej: guía FAO, manual de campo, reporte de laboratorio"
                {...register('referenciaBibliografica')}
              />
            </label>
            {mensaje && <p className="mensaje-ok">{mensaje}</p>}
            <div><Boton type="submit">Guardar ficha (offline)</Boton></div>
          </div>
        )}
      </div>
      </div>
    </form>
  );
}
