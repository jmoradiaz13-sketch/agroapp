import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaFichaSuelo, type FichaSueloFormulario } from '../../esquemas/suelo';
import { RANGOS_VALIDADOS, semaforoPara, type Semaforo } from '../../datos/rangos';
import { PropiedadesFisicas, DIAPOSITIVAS_FISICAS, SLIDE_DE_VARIABLE_FISICA, variableFisicaDeSlide } from './PropiedadesFisicas';
import { PropiedadesQuimicas, DIAPOSITIVAS_QUIMICAS } from './PropiedadesQuimicas';
import { PropiedadesBiologicas, DIAPOSITIVAS_BIOLOGICAS } from './PropiedadesBiologicas';
import { INDICADORES_VSA, SLIDE_DE_VARIABLE_BIOLOGICA } from '../../datos/biologicas';
import { analizarCobertura, blobAUrl, type FotoLista } from '../../servicios/fotos';
import type { FotoCoberturaVista } from '../../datos/biologicas';
import { usarGps, textoPrecision } from '../../servicios/gps';
import { baseDatos } from '../../base_datos/local';
import { Boton } from '../ui/Boton';
import { IndiceCategoria } from './IndiceCategoria';
import {
  VARIABLES_QUIMICAS, VARIABLES_BIOLOGICAS, resumenVariables,
} from '../../datos/variables_suelo';

type Paso = 'bienvenida' | 'general' | 'categorias' | 'fisicas' | 'quimicas' | 'biologicas' | 'resumen';

const PASOS: { id: Paso; titulo: string }[] = [
  { id: 'bienvenida', titulo: 'Presentación' },
  { id: 'general', titulo: 'Datos del terreno' },
  { id: 'categorias', titulo: 'Ficha' },
  { id: 'fisicas', titulo: 'Propiedades físicas' },
  { id: 'quimicas', titulo: 'Propiedades químicas' },
  { id: 'biologicas', titulo: 'Propiedades biológicas' },
  { id: 'resumen', titulo: 'Interpretación' },
];

function normalizarValoresSuelo(valores: FichaSueloFormulario): FichaSueloFormulario {
  return Object.fromEntries(
    Object.entries(valores).map(([clave, valor]) => [
      clave,
      valor === '' || valor === null || (typeof valor === 'number' && !Number.isFinite(valor))
        ? undefined
        : valor,
    ]),
  ) as FichaSueloFormulario;
}

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

// Campos del paso "Datos del terreno": se validan al pulsar "Registrar y continuar".
const CAMPOS_GENERALES: { nombre: keyof FichaSueloFormulario; etiqueta: string }[] = [
  { nombre: 'predioIdentificador', etiqueta: 'Predio' },
  { nombre: 'fecha', etiqueta: 'Fecha de muestreo' },
  { nombre: 'vereda', etiqueta: 'Vereda' },
  { nombre: 'municipio', etiqueta: 'Municipio' },
  { nombre: 'departamento', etiqueta: 'Departamento' },
  { nombre: 'latitud', etiqueta: 'Latitud' },
  { nombre: 'longitud', etiqueta: 'Longitud' },
  { nombre: 'precisionM', etiqueta: 'Precisión GPS' },
  { nombre: 'msnm', etiqueta: 'Altitud (msnm)' },
  { nombre: 'pendienteSitioPct', etiqueta: 'Pendiente (%)' },
  { nombre: 'posicionRelieve', etiqueta: 'Posición en el relieve' },
  { nombre: 'solicitante', etiqueta: 'Nombre del solicitante' },
  { nombre: 'tenenciaSitio', etiqueta: 'Tenencia del sitio' },
  { nombre: 'laboratorio', etiqueta: 'Laboratorio / observador' },
  { nombre: 'profundidadCm', etiqueta: 'Profundidad de muestreo (cm)' },
  { nombre: 'usoActual', etiqueta: 'Uso actual' },
  { nombre: 'tipoEvaluacion', etiqueta: 'Tipo de evaluación' },
  { nombre: 'manejoReciente', etiqueta: 'Historial de uso' },
];

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

// Submenús del riel: variables de cada deck (4.1 Textura, 5.1 Acidez…).
const SUBMENUS: Partial<Record<'fisicas' | 'quimicas' | 'biologicas', { id: string; titulo: string }[]>> = {
  fisicas: DIAPOSITIVAS_FISICAS,
  quimicas: DIAPOSITIVAS_QUIMICAS,
  biologicas: DIAPOSITIVAS_BIOLOGICAS,
};
const NUMERO_PASO: Record<Paso, number> = {
  bienvenida: 1, general: 2, categorias: 3, fisicas: 4, quimicas: 5, biologicas: 6, resumen: 7,
};

// Ficha: las 3 categorías como botones de selección hacia su índice.
const CATEGORIAS_FICHA: { id: 'fisicas' | 'quimicas' | 'biologicas'; titulo: string; descripcion: string; imagen: string; imagenAlt: string }[] = [
  {
    id: 'fisicas', titulo: 'Físicas: la casa',
    descripcion: 'Textura, estructura, densidad y porosidad definen dónde viven las raíces, cuánta agua se guarda y si el aire circula.',
    imagen: '/imagenes/3.jpg', imagenAlt: 'Agregados del suelo',
  },
  {
    id: 'quimicas', titulo: 'Químicas: la despensa',
    descripcion: 'pH, materia orgánica y nutrientes dicen qué hay disponible para comer. La planta vigorosa es la prueba final.',
    imagen: '/imagenes/4.jpg', imagenAlt: 'Cultivo vigoroso',
  },
  {
    id: 'biologicas', titulo: 'Biológicas: la vida',
    descripcion: 'Lombrices, raíces y microorganismos trabajan el suelo gratis. Donde hay vida, el suelo respira.',
    imagen: '/imagenes/1.jpg', imagenAlt: 'Plántulas emergiendo',
  },
];
export function FichaSueloWizard({ predioIdentificador, loteNombre }: { predioIdentificador: string; loteNombre?: string }) {
  const [paso, setPaso] = useState<Paso>('bienvenida');
  const [visitados, setVisitados] = useState<Paso[]>(['bienvenida']);
  // Diapositiva destino por deck (la fija el submenú del riel).
  const [diapos, setDiapos] = useState<Partial<Record<'fisicas' | 'quimicas' | 'biologicas', number>>>({});
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [mensaje, setMensaje] = useState('');
  // Nota del registro de terreno: error en "Datos del terreno", éxito en "Ficha".
  const [notaTerreno, setNotaTerreno] = useState<{ tipo: 'ok' | 'error'; texto: string; detalle?: string[] } | null>(null);
  const [fotosEtapa, setFotosEtapa] = useState<FotoLista[]>([]);
  const [fotoCobertura, setFotoCobertura] = useState<FotoCoberturaVista | null>(null);
  const [borradorRestaurado, setBorradorRestaurado] = useState(false);
  const [cargandoBorrador, setCargandoBorrador] = useState(true);
  const [finalizado, setFinalizado] = useState(false);
  const claveBorrador = `${predioIdentificador}::${loteNombre ?? ''}`;
  const valoresIniciales: FichaSueloFormulario = {
    predioIdentificador,
    loteNombre,
    fecha: new Date().toISOString().slice(0, 10),
    tipoEvaluacion: 'mixta',
  };
  const { register, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = useForm<FichaSueloFormulario>({
    resolver: zodResolver(esquemaFichaSuelo),
    defaultValues: valoresIniciales,
  });
  const valores = normalizarValoresSuelo(watch());

  // Recupera el borrador del contexto (predio + lote) sin crear una ficha parcial.
  useEffect(() => {
    let vigente = true;
    setCargandoBorrador(true);
    void baseDatos.borradoresSuelo.where('clave').equals(claveBorrador).first()
      .then((b) => {
        if (!vigente || !b) return;
        reset({ ...valoresIniciales, ...b.datos });
        setPuntajes(b.puntajes);
        setBorradorRestaurado(true);
        setPaso('general');
        setVisitados(['bienvenida', 'general']);
      })
      .finally(() => { if (vigente) setCargandoBorrador(false); });
    return () => { vigente = false; };
    // El componente se remonta cuando cambia el contexto (key en PaginaSuelos).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveBorrador, reset]);

  // Autoguardado: nunca inventa una versión histórica ni sincroniza el borrador.
  useEffect(() => {
    if (cargandoBorrador || finalizado || paso === 'bienvenida') return;
    const temporizador = window.setTimeout(() => {
      void (async () => {
        const existente = await baseDatos.borradoresSuelo.where('clave').equals(claveBorrador).first();
        await baseDatos.borradoresSuelo.put({
          ...(existente?.id !== undefined ? { id: existente.id } : {}),
          clave: claveBorrador,
          predioIdentificador,
          loteNombre,
          datos: valores,
          puntajes,
          fechaActualizacion: new Date().toISOString(),
        });
      })();
    }, 700);
    return () => window.clearTimeout(temporizador);
  }, [valores, puntajes, cargandoBorrador, finalizado, paso, claveBorrador, predioIdentificador, loteNombre]);

  const descartarBorrador = async () => {
    await baseDatos.borradoresSuelo.where('clave').equals(claveBorrador).delete();
    reset(valoresIniciales);
    setPuntajes({});
    setDiapos({});
    setFotosEtapa([]);
    setFotoCobertura(null);
    setBorradorRestaurado(false);
    setFinalizado(false);
    setPaso('bienvenida');
    setVisitados(['bienvenida']);
    setMensaje('Borrador descartado. Puedes empezar una ficha nueva.');
  };

  const tocadosVsa = INDICADORES_VSA.filter((k) => puntajes[k] !== undefined).length;
  const conteosVsa = { vsa: { hechos: tocadosVsa, total: INDICADORES_VSA.length } };
  const gps = usarGps();
  const fijarGps = () => {
    gps.ubicar((lat, lng, acc) => {
      setValue('latitud', Math.round(lat * 100000) / 100000);
      setValue('longitud', Math.round(lng * 100000) / 100000);
      setValue('precisionM', Math.round(acc));
    });
  };

  // Submenús plegables: se abren al entrar al paso, se cierran al salir
  // o con la flecha. Solo un grupo abierto a la vez.
  const [grupoAbierto, setGrupoAbierto] = useState<'fisicas' | 'quimicas' | 'biologicas' | null>(null);

  const irAPaso = (p: Paso) => {
    setPaso(p);
    setVisitados((v) => (v.includes(p) ? v : [...v, p]));
    if (p === 'fisicas' || p === 'quimicas' || p === 'biologicas') {
      setGrupoAbierto(p);
    } else {
      setGrupoAbierto(null);
    }
  };
  const irAVariable = (destino: Paso, i: number) => {
    if (destino === 'fisicas' || destino === 'quimicas' || destino === 'biologicas') {
      setDiapos((d) => ({ ...d, [destino]: i }));
    }
    irAPaso(destino);
  };

  const alGuardar = async (datos: FichaSueloFormulario) => {
    setNotaTerreno(null);
    const fecha = datos.fecha || new Date().toISOString().slice(0, 10);
    const lote = datos.loteNombre ?? '';
    const hermanas = await baseDatos.fichasSuelo.where('predioIdentificador').equals(datos.predioIdentificador).toArray();
    const delContexto = hermanas.filter((f) => (f.loteNombre ?? '') === lote);
    const version = Math.max(0, ...delContexto.map((f) => f.version)) + 1;
    const fichaId = await baseDatos.fichasSuelo.add({ ...datos, fecha, version, sincronizada: false });
    for (const f of fotosEtapa) {
      await baseDatos.fotos.add({
        fichaId, predioIdentificador: datos.predioIdentificador,
        tipo: f.tipo, foto: f.blob, miniatura: f.miniatura,
        lat: f.lat, lng: f.lng, coberturaPct: f.coberturaPct,
        fecha, sincronizada: false,
      });
    }
    setFotosEtapa([]);
    const tocados = INDICADORES_VSA.filter((i) => puntajes[i] !== undefined);
    if (tocados.length > 0) {
      const completo = tocados.length === INDICADORES_VSA.length;
      const vals = INDICADORES_VSA.map((i) => puntajes[i] ?? 0);
      const indice = completo
        ? Math.round((vals.reduce((a, b) => a + b, 0) / (INDICADORES_VSA.length * 2)) * 100)
        : undefined;
      await baseDatos.monitoreos.add({
        fichaId,
        predioIdentificador: datos.predioIdentificador,
        loteNombre: datos.loteNombre ?? 'predio',
        fecha,
        indicadores: { ...(indice !== undefined ? { vsa_indice: indice } : {}), ...puntajes },
        observaciones: completo
          ? `VSA campo índice ${indice}/100`
          : `VSA parcial ${tocados.length}/${INDICADORES_VSA.length}; sin índice`,
        sincronizada: false,
      });
    }
    await baseDatos.borradoresSuelo.where('clave').equals(claveBorrador).delete();
    setBorradorRestaurado(false);
    setFinalizado(true);
    setMensaje(`Ficha v${version} guardada offline. Lo interpretado con rango validado aparece en Lectura; lo demás queda registrado sin interpretar.`);
  };

  // "Registrar y continuar": los datos del terreno son opcionales; se registra
  // con lo que se tenga y se pasa a "Ficha" para las propiedades del suelo.
  const [registrando, setRegistrando] = useState(false);
  const registrarYContinuar = async () => {
    if (registrando) return;
    setRegistrando(true);
    try {
      const datosBase = getValues();
      // Trazabilidad mínima (§2.1): si la fecha quedó vacía, se repone a hoy.
      const fecha = datosBase.fecha || new Date().toISOString().slice(0, 10);
      if (fecha !== datosBase.fecha) setValue('fecha', fecha);
      const datos = { ...datosBase, fecha };
      const validacion = esquemaFichaSuelo.safeParse(datos);
      const issues = validacion.success ? [] : validacion.error.issues;
      // Solo un valor inválido de este paso (ej. latitud fuera de rango) puede
      // frenar el registro; lo demás se corrige en su propio paso.
      const delTerreno = issues.filter((i) => CAMPOS_GENERALES.some((c) => c.nombre === i.path[0]));
      if (delTerreno.length > 0) {
        setNotaTerreno({
          tipo: 'error',
          texto: 'Corrige los siguientes datos del terreno antes de continuar.',
          detalle: delTerreno.map((i) => {
            const campo = CAMPOS_GENERALES.find((c) => c.nombre === i.path[0]);
            return `${campo?.etiqueta ?? String(i.path[0])}: ${i.message}`;
          }),
        });
        return;
      }
      setNotaTerreno({
        tipo: 'ok',
        texto: 'Datos del terreno validados. El borrador queda en este dispositivo; la ficha se guarda como nueva versión al finalizar.',
      });
      irAPaso('categorias');
    } finally {
      setRegistrando(false);
    }
  };

  const conValor = RANGOS_VALIDADOS.filter((r) => {
    const v = valores[r.parametro as keyof FichaSueloFormulario];
    return typeof v === 'number' && !Number.isNaN(v);
  }).length;

  const urlsFotos = useMemo(() => {
    const urls = fotosEtapa.map((f) => blobAUrl(f.miniatura));
    return urls;
  }, [fotosEtapa]);
  useEffect(() => () => { urlsFotos.forEach((u) => URL.revokeObjectURL(u)); }, [urlsFotos]);

  const indicePaso = PASOS.findIndex((p) => p.id === paso);
  const irIndice = (i: number) => {
    if (i >= 0 && i < PASOS.length) irAPaso(PASOS[i].id);
  };

  return (
    <form onSubmit={handleSubmit(alGuardar)} className="ventana-ficha grid lg:grid-cols-[300px_minmax(0,1fr)] overflow-hidden w-full" style={{ background: 'var(--marca)', border: '1px solid var(--borde)', boxShadow: 'var(--sombra-suave)' }} aria-label="Caracterización del suelo">
      {/* Riel de lecciones integrado: título + pasos plegables */}
      <aside className="grid gap-2 content-start p-3 sm:p-5 border-b lg:border-b-0 lg:border-r lg:overflow-y-auto lg:min-h-0 scroll-sutil" style={{ borderColor: 'var(--borde)' }} aria-label="Contenido de la caracterización">
        <div className="hidden lg:grid gap-1.5 pb-3" style={{ borderBottom: '1px solid var(--borde)' }}>
          <Link to="/" className="mono-micro inline-flex items-center gap-1.5 w-fit transition-opacity hover:opacity-70" style={{ color: 'var(--marca-muted)' }}>
            <span aria-hidden>←</span> Tablero
          </Link>
          <h2 className="font-display text-2xl font-medium leading-tight" style={{ color: 'var(--marca-texto)' }}>Suelos</h2>
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--marca-muted)' }}>
            Ficha de caracterización física, química y biológica por versiones. Cada guardado crea una nueva versión con fecha.
          </p>
        </div>
        <div className="hidden lg:grid gap-1.5">
          <p className="mono-micro" style={{ color: 'var(--marca-muted)' }}>Caracterización · {visitados.length} de {PASOS.length}</p>
        </div>
        <ol className="hidden lg:grid gap-1" role="tablist" aria-label="Pasos de caracterización">
          {PASOS.map((p, i) => {
            const actual = paso === p.id;
            const visto = visitados.includes(p.id);
            const subs = SUBMENUS[p.id as 'fisicas' | 'quimicas' | 'biologicas'];
            const desplegado = grupoAbierto === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button" role="tab" aria-selected={actual}
                  aria-expanded={subs ? desplegado : undefined}
                  onClick={() => {
                    if (actual && subs) {
                      setGrupoAbierto(desplegado ? null : (p.id as 'fisicas' | 'quimicas' | 'biologicas'));
                    } else {
                      irAPaso(p.id);
                    }
                  }}
                  className="boton-campo w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-all"
                  style={actual
                    ? { background: 'var(--marca-texto)', color: 'var(--marca)' }
                    : { background: 'transparent', color: 'var(--marca-muted)' }}
                >
                  <span className="mono-micro shrink-0" style={{ opacity: actual ? 0.75 : 0.6 }} aria-hidden>
                    {visto && !actual ? '✓' : `0${i + 1}`}
                  </span>
                  <span className="font-semibold leading-tight">{p.titulo}</span>
                  {subs && (
                    <span aria-hidden className={`ml-auto text-[10px] transition-transform ${desplegado ? 'rotate-180' : ''}`}>▾</span>
                  )}
                  {!subs && actual && <span aria-hidden className="ml-auto">→</span>}
                </button>
                {actual && desplegado && subs && (
                  <ul className="grid gap-px mt-1 ml-4 pl-3 animacion-entrada" style={{ borderLeft: '1px solid var(--borde)' }} aria-label={`Variables de ${p.titulo}`}>
                    {subs.map((s, j) => (
                      <li key={s.id ?? s.titulo}>
                        <button
                          type="button"
                          onClick={() => irAVariable(p.id, j)}
                          className="boton-campo w-full text-left px-2 py-2 text-[12.5px] transition-colors hover:underline underline-offset-4"
                          style={{ color: 'var(--marca-texto)' }}
                          aria-current={diapos[p.id as 'fisicas' | 'quimicas' | 'biologicas'] === j}
                        >
                          <span className="mono-micro" style={{ opacity: 0.65 }} aria-hidden>{NUMERO_PASO[p.id]}.{j + 1} </span>
                          {s.titulo}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
        {/* En móvil: tira horizontal compacta */}
        <div className="scroll-sutil flex lg:hidden flex-nowrap gap-1.5 overflow-x-auto" role="tablist" aria-label="Pasos de caracterización">
          {PASOS.map((p, i) => (
            <button
              key={p.id} type="button" role="tab" aria-selected={paso === p.id}
              onClick={() => irAPaso(p.id)}
              className="boton-campo shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold transition-colors"
              style={paso === p.id
                ? { background: 'var(--marca-texto)', color: 'var(--marca)' }
                : { background: 'transparent', color: 'var(--marca-muted)', border: '1px solid var(--borde)' }}
            >
              {i + 1} · {p.titulo}
            </button>
          ))}
        </div>
        {paso === 'fisicas' && (
          <div className="grid gap-2 mt-2 p-2 border" style={{ borderColor: 'var(--borde)' }} aria-label="Índice de variables físicas">
            <p className="mono-micro" style={{ color: 'var(--marca-muted)' }}>Físicas · ¿qué variable estudias?</p>
            <IndiceCategoria
              categoria="fisicas"
              valores={valores}
              variableActiva={variableFisicaDeSlide(diapos.fisicas ?? 0)}
              alElegir={(id) => {
                irAVariable('fisicas', SLIDE_DE_VARIABLE_FISICA[id] ?? 0);
              }}
            />
          </div>
        )}
        {paso === 'quimicas' && (
          <div className="grid gap-2 mt-2 p-2 border" style={{ borderColor: 'var(--borde)' }} aria-label="Índice de variables químicas">
            <p className="mono-micro" style={{ color: 'var(--marca-muted)' }}>Químicas · ¿qué variable estudias?</p>
            <IndiceCategoria
              categoria="quimicas"
              valores={valores}
              variableActiva={VARIABLES_QUIMICAS[(diapos.quimicas ?? 0)]?.id ?? null}
              alElegir={(id) => {
                const i = VARIABLES_QUIMICAS.findIndex((v) => v.id === id);
                irAVariable('quimicas', Math.min(Math.max(0, i), DIAPOSITIVAS_QUIMICAS.length - 1));
              }}
            />
          </div>
        )}
        {paso === 'biologicas' && (
          <div className="hidden lg:grid gap-2 mt-2 p-2 border" style={{ borderColor: 'var(--borde)' }} aria-label="Índice de variables biológicas">
            <p className="mono-micro" style={{ color: 'var(--marca-muted)' }}>Biológicas · ¿qué variable estudias?</p>
            <IndiceCategoria
              categoria="biologicas"
              valores={valores}
              variableActiva={VARIABLES_BIOLOGICAS[(diapos.biologicas ?? 0)]?.id ?? null}
              alElegir={(id) => irAVariable('biologicas', SLIDE_DE_VARIABLE_BIOLOGICA[id] ?? 0)}
              conteosExtra={conteosVsa}
            />
          </div>
        )}
      </aside>

      {/* Pantalla: marco oscuro + pantalla clara con scroll interno */}
      <div className="grid grid-rows-[minmax(0,1fr)_auto] min-h-0 min-w-0 p-2 sm:p-4 gap-2 sm:gap-3">
      <div key={paso} className="animacion-entrada p-4 sm:p-5 grid gap-4 sm:gap-5 content-start overflow-y-auto min-h-0 scroll-sutil" style={{ background: 'var(--sup)' }} role="tabpanel" aria-label={PASOS.find((p) => p.id === paso)?.titulo}>
        {borradorRestaurado && !finalizado && (
          <div className="flex flex-wrap items-center gap-2 p-3" style={{ background: 'var(--acento-suave)', border: '1px solid var(--borde)' }} role="status">
            <p className="text-sm" style={{ color: 'var(--texto)' }}>
              Borrador recuperado de este predio{loteNombre ? ` y lote ${loteNombre}` : ''}. Se guardará como versión solo al finalizar.
            </p>
            <button type="button" onClick={() => void descartarBorrador()} className="boton-campo ml-auto text-xs font-semibold underline underline-offset-4" style={{ color: 'var(--texto)' }}>
              Descartar borrador
            </button>
          </div>
        )}
        {paso === 'bienvenida' && (
          <div className="grid gap-5">
            <div className="relative overflow-hidden">
              <img src="/imagenes/2.jpg" alt="Perfil de suelo con raíces" loading="lazy" className="w-full h-36 sm:h-44 object-cover" />
              <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,47,49,0.85) 0%, rgba(11,47,49,0.15) 70%)' }} aria-hidden />
              <span className="absolute bottom-3 left-4 right-4 grid gap-0.5">
                <span className="mono-micro" style={{ color: '#F6B23D' }}>Antes de muestrear</span>
                <span className="font-display text-2xl sm:text-3xl font-medium leading-tight" style={{ color: '#F2E9D8' }}>Conoce tu suelo antes de medirlo</span>
              </span>
            </div>
            <div className="grid gap-3 content-start" style={{ maxWidth: '62ch' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Caracterizar es describir el suelo tal como está en campo para decidir con datos, no por costumbre.
                Cada suelo se lee en tres dimensiones que trabajan juntas: lo que se ve y se toca, lo que alimenta
                a la planta y lo que vive en él. Registrarlas por separado —y con fecha— permite comparar en el
                tiempo y demostrar el efecto de cada práctica.
              </p>
              <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
                A continuación: los <strong style={{ color: 'var(--texto)' }}>datos del terreno</strong> — fecha, profundidad y condiciones del muestreo.
                Después abrirás la ficha y elegirás qué dimensiones caracterizar.
              </p>
              <div><Boton type="button" onClick={() => irAPaso('general')}>Empezar</Boton></div>
            </div>
          </div>
        )}

        {paso === 'general' && (
          <div className="grid gap-5">
            <Grupo titulo="Zona de estudio">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="etiqueta-campo">Vereda
                  <input className="campo-entrada" placeholder="Ej: El Mirador" {...register('vereda')} />
                </label>
                <label className="etiqueta-campo">Municipio
                  <input className="campo-entrada" placeholder="Ej: Tibasosa" {...register('municipio')} />
                </label>
                <label className="etiqueta-campo">Departamento
                  <input className="campo-entrada" placeholder="Ej: Boyacá" {...register('departamento')} />
                </label>
                <label className="etiqueta-campo">Fecha de muestreo
                  <input className="campo-entrada" type="date" {...register('fecha')} />
                </label>
                <label className="etiqueta-campo">Latitud
                  <input className="campo-entrada" type="number" step="0.00001" {...register('latitud')} />
                </label>
                <label className="etiqueta-campo">Longitud
                  <input className="campo-entrada" type="number" step="0.00001" {...register('longitud')} />
                </label>
              </div>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={fijarGps} className="boton-campo px-4 py-2 text-sm font-semibold transition-colors" style={{ background: 'var(--marca)', color: 'var(--marca-texto)' }}>
                    Generar coordenadas con GPS
                  </button>
                  {gps.precision !== null && (
                    <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{textoPrecision(gps.precision)}</span>
                  )}
                </div>
                {gps.mensaje && <p className="mensaje-info">{gps.mensaje}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="etiqueta-campo">Altitud (msnm)
                  <input className="campo-entrada" type="number" step="1" {...register('msnm')} />
                </label>
                <label className="etiqueta-campo">Pendiente (%)
                  <input className="campo-entrada" type="number" step="0.5" min="0" {...register('pendienteSitioPct')} />
                </label>
                <Sel etiqueta="Posición en el relieve" registro={register} nombre="posicionRelieve" opciones={['cima', 'hombro', 'ladera', 'pie', 'valle']} />
              </div>
            </Grupo>
            <Grupo titulo="Responsable y manejo">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="etiqueta-campo">Nombre del solicitante
                  <input className="campo-entrada" placeholder="Quien pide el estudio" {...register('solicitante')} />
                </label>
                <Sel etiqueta="Tenencia del sitio" registro={register} nombre="tenenciaSitio" opciones={['propietario', 'arrendatario', 'poseedor', 'otro']} />
                <label className="etiqueta-campo">Laboratorio / observador
                  <input className="campo-entrada" placeholder="Ej: IGAC Tibaitatá / técnico campo" {...register('laboratorio')} />
                </label>
                <label className="etiqueta-campo">Profundidad de muestreo (cm)
                  <input className="campo-entrada" type="number" step="1" min="0" {...register('profundidadCm')} />
                </label>
                <label className="etiqueta-campo">Uso actual
                  <input className="campo-entrada" placeholder="Ej: potrero, cafetal, rastrojo" {...register('usoActual')} />
                </label>
                <Sel etiqueta="Tipo de evaluación" registro={register} nombre="tipoEvaluacion" opciones={OPCIONES.tipoEvaluacion} />
                <label className="etiqueta-campo sm:col-span-2">Historial de uso
                  <input className="campo-entrada" placeholder="Ej: potrero 5 años, antes café, fertilización anual" {...register('manejoReciente')} />
                </label>
              </div>
            </Grupo>
            {notaTerreno?.tipo === 'error' && (
              <div className="grid gap-1" role="alert">
                <p className="mensaje-error">{notaTerreno.texto}</p>
                {(notaTerreno.detalle ?? []).map((d) => (
                  <p key={d} className="mensaje-error">{d}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {paso === 'categorias' && (
          <div className="grid gap-4">
            <div className="grid gap-1" style={{ maxWidth: '62ch' }}>
              <h2 className="font-display text-2xl font-medium" style={{ color: 'var(--texto)' }}>Ficha de caracterización</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Elige qué dimensiones caracterizar: una sola, dos, o las tres para una interpretación integral.
                Cada botón abre su índice de variables; puedes volver aquí para cambiar de categoría.
              </p>
            </div>
            {notaTerreno?.tipo === 'ok' && (
              <p className="mensaje-ok" role="status">{notaTerreno.texto}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-3 sm:items-start">
              {CATEGORIAS_FICHA.map((c) => {
                const extra = c.id === 'biologicas' ? conteosVsa : undefined;
                const r = resumenVariables(c.id, valores, extra);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => irAPaso(c.id)}
                    className="boton-campo grid grid-rows-[auto_1fr] gap-0 p-0 text-left transition-all min-h-[44px] hover:-translate-y-0.5 overflow-hidden"
                    style={{ background: 'var(--sup-2)', border: '1px solid var(--borde)' }}
                    aria-label={`Entrar a ${c.titulo}: ${r.registradas} de ${r.total} variables registradas`}
                  >
                    <img src={c.imagen} alt={c.imagenAlt} loading="lazy" className="w-full h-28 sm:h-32 object-cover" />
                    <span className="grid gap-1.5 p-3 content-start">
                      <strong className="font-display text-base font-medium leading-tight" style={{ color: 'var(--texto)' }}>{c.titulo}</strong>
                      <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{c.descripcion}</span>
                      <span className="relative block h-1 mt-1 rounded-full bg-neutral-200" aria-hidden>
                        <span className="absolute inset-y-0 left-0 rounded-full bg-[#059669]" style={{ width: `${r.total ? Math.round((r.registradas / r.total) * 100) : 0}%` }} />
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--acento)' }}>
                        {r.registradas} de {r.total} variables · Entrar →
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {paso === 'fisicas' && (
          <PropiedadesFisicas registro={register} fijar={setValue} valores={valores} errorGranulometria={errors.arcillaPct?.message} alFoto={(f) => setFotosEtapa((v) => [...v, f])} alIrResumen={() => irAPaso('resumen')} diapositiva={diapos.fisicas ?? null} />
        )}

        {paso === 'quimicas' && (
          <PropiedadesQuimicas
            registro={register}
            fijar={setValue}
            valores={valores}
            alIrResumen={() => irAPaso('resumen')}
            alNavegar={(i) => setDiapos((d) => ({ ...d, quimicas: i }))}
            diapositiva={diapos.quimicas ?? null}
          />
        )}

        {paso === 'biologicas' && (
          <PropiedadesBiologicas
            registro={register}
            fijar={setValue}
            valores={valores}
            puntajes={puntajes}
            setPuntajes={setPuntajes}
            fotoCobertura={fotoCobertura}
            alFotoCobertura={async (f) => {
              const analisis = await analizarCobertura(f.blob);
              setFotoCobertura({ url: blobAUrl(f.miniatura), pct: analisis.pct, mascara: analisis.mascara });
              setFotosEtapa((v) => [...v.filter((x) => x.tipo !== 'cobertura'), { ...f, coberturaPct: analisis.pct }]);
            }}
            alUsarCobertura={(pct) => setValue('coberturaVegetalPct', pct)}
            alIrResumen={() => irAPaso('resumen')}
            alNavegar={(i) => setDiapos((d) => ({ ...d, biologicas: i }))}
            diapositiva={diapos.biologicas ?? null}
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
        {paso !== 'bienvenida' && (
        <nav className="flex items-center justify-end gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-t" style={{ borderColor: 'var(--borde)' }} aria-label="Navegación de la ficha">
          {paso === 'categorias' ? (
            <button
              type="button"
              onClick={() => irAPaso('general')}
              className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: 'transparent', color: 'var(--marca-texto)', border: '1px solid var(--marca-muted)' }}
            >
              <span aria-hidden>←</span> Volver a datos
            </button>
          ) : (
            <>
              {(paso === 'fisicas' || paso === 'quimicas' || paso === 'biologicas') && (
                <button
                  type="button"
                  onClick={() => irAPaso('categorias')}
                  className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
                  style={{ background: 'transparent', color: 'var(--acento)', border: '1px solid var(--borde)' }}
                >
                  Categorías
                </button>
              )}
              {paso !== 'general' && (
              <button
                type="button"
                onClick={() => irIndice(indicePaso - 1)}
                disabled={indicePaso === 0}
                className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: 'transparent', color: 'var(--marca-texto)', border: '1px solid var(--marca-muted)' }}
              >
                <span aria-hidden>←</span> Anterior
              </button>
              )}
              <button
                type="button"
                onClick={() => { if (paso === 'general') void registrarYContinuar(); else irIndice(indicePaso + 1); }}
                disabled={registrando || indicePaso === PASOS.length - 1}
                className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: 'var(--marca-texto)', color: 'var(--marca)' }}
              >
                {paso === 'general' ? 'Registrar y continuar' : 'Continuar'} <span aria-hidden>→</span>
              </button>
            </>
          )}
        </nav>
        )}
      </div>
    </form>
  );
}
