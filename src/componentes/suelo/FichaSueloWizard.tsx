import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaFichaSuelo, type FichaSueloFormulario } from '../../esquemas/suelo';
import { RANGOS_VALIDADOS, semaforoPara, type Semaforo } from '../../datos/rangos';
import { PropiedadesFisicas } from './PropiedadesFisicas';
import { PropiedadesQuimicas } from './PropiedadesQuimicas';
import { PropiedadesBiologicas } from './PropiedadesBiologicas';
import { ProgresoFicha } from './ProgresoFicha';
import { INDICADORES_VSA } from '../../datos/biologicas';
import { analizarCobertura, blobAUrl, type FotoLista } from '../../servicios/fotos';
import type { FotoCoberturaVista } from '../../datos/biologicas';
import { usarGps, textoPrecision } from '../../servicios/gps';
import { baseDatos, type FichaSueloLocal } from '../../base_datos/local';
import { EVENTO_FICHAS_ACTUALIZADAS } from '../../servicios/migraciones';
import { usoFlujo } from '../../estado/usoFlujo';
import { Boton, BotonSecundario } from '../ui/Boton';
import { LecturaSuelo } from './LecturaSuelo';
import { Icono } from '../Iconos';
import { resumenVariables } from '../../datos/variables_suelo';

type Paso = 'bienvenida' | 'fichas' | 'lectura' | 'general' | 'categorias' | 'fisicas' | 'quimicas' | 'biologicas' | 'resumen';

const PASOS: { id: Paso; titulo: string }[] = [
  { id: 'bienvenida', titulo: 'Inicio' },
  { id: 'general', titulo: 'Datos del terreno' },
  { id: 'categorias', titulo: 'Tipo de análisis' },
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
  { nombre: 'nombrePredio', etiqueta: 'Nombre del predio' },
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

// Marca visual de campo obligatorio para crear la ficha.
function Obligatorio() {
  return (
    <>
      <span aria-hidden="true" style={{ color: '#dc2626' }}> *</span>
      <span className="sr-only"> (obligatorio)</span>
    </>
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

// Tipo de análisis: cada tarjeta abre su índice o la interpretación integral.
const CATEGORIAS_FICHA: {
  id: 'fisicas' | 'quimicas' | 'biologicas' | 'completo';
  titulo: string; descripcion: string; imagen: string; imagenAlt: string; destino: Paso;
}[] = [
  {
    id: 'fisicas', titulo: 'Físico',
    descripcion: 'Textura, estructura, densidad y porosidad definen dónde viven las raíces y cómo circulan el agua y el aire.',
    imagen: '/imagenes/3.jpg', imagenAlt: 'Agregados del suelo', destino: 'fisicas',
  },
  {
    id: 'quimicas', titulo: 'Químico',
    descripcion: 'pH, materia orgánica y nutrientes disponibles para el cultivo.',
    imagen: '/imagenes/4.jpg', imagenAlt: 'Cultivo vigoroso', destino: 'quimicas',
  },
  {
    id: 'biologicas', titulo: 'Biológico',
    descripcion: 'Lombrices, raíces y microorganismos que sostienen la vida del suelo.',
    imagen: '/imagenes/1.jpg', imagenAlt: 'Plántulas emergiendo', destino: 'biologicas',
  },
  {
    id: 'completo', titulo: 'Completo',
    descripcion: 'Integra las tres dimensiones en una interpretación integral.',
    imagen: '/imagenes/5.jpg', imagenAlt: 'Vista satelital del territorio', destino: 'resumen',
  },
];
export function FichaSueloWizard({
  predioIdentificador, loteNombre, vistaInicial = 'ficha', versionInicial,
}: {
  predioIdentificador: string;
  loteNombre?: string;
  vistaInicial?: 'ficha' | 'fichas' | 'lectura';
  versionInicial?: number;
}) {
  const pasoInicial: Paso = vistaInicial === 'lectura' ? 'lectura' : vistaInicial === 'fichas' ? 'fichas' : 'bienvenida';
  const [paso, setPaso] = useState<Paso>(pasoInicial);
  const [introRegistro, setIntroRegistro] = useState(false);
  // Diapositiva destino por deck (la fijan la barra superior o el pie del deck).
  const [diapos, setDiapos] = useState<Partial<Record<'fisicas' | 'quimicas' | 'biologicas', number>>>({});
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [mensaje, setMensaje] = useState('');
  // Nota de validación del registro de terreno.
  const [notaTerreno, setNotaTerreno] = useState<{ texto: string; detalle?: string[] } | null>(null);
  const [fotosEtapa, setFotosEtapa] = useState<FotoLista[]>([]);
  const [fotoCobertura, setFotoCobertura] = useState<FotoCoberturaVista | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const claveBorrador = `${predioIdentificador}::${loteNombre ?? ''}`;
  const valoresIniciales: FichaSueloFormulario = {
    predioIdentificador,
    nombrePredio: '',
    loteNombre,
    fecha: new Date().toISOString().slice(0, 10),
    municipio: '',
    departamento: '',
    solicitante: '',
    tipoEvaluacion: 'mixta',
  };
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FichaSueloFormulario>({
    resolver: zodResolver(esquemaFichaSuelo),
    defaultValues: valoresIniciales,
  });
  const valores = normalizarValoresSuelo(watch());

  // Nombre del predio editable: llega precargado desde el predio seleccionado.
  useEffect(() => {
    let vigente = true;
    void baseDatos.predios.where('identificador').equals(predioIdentificador).first().then((p) => {
      if (vigente && p?.nombre) setValue('nombrePredio', p.nombre);
    });
    return () => { vigente = false; };
  }, [predioIdentificador, setValue]);

  const guardarTerreno = async (datos: FichaSueloFormulario) => {
    const existente = await baseDatos.borradoresSuelo.where('clave').equals(claveBorrador).first();
    await baseDatos.borradoresSuelo.put({
      ...(existente?.id !== undefined ? { id: existente.id } : {}),
      clave: claveBorrador,
      predioIdentificador,
      loteNombre,
      datos,
      puntajes,
      fechaActualizacion: new Date().toISOString(),
    });
  };

  // La entrada a Suelos siempre abre el inicio del asistente; el borrador de
  // un terreno a medio registrar no salta pasos automáticamente.

  // Lista de fichas guardadas (terrenos caracterizados) y sus análisis.
  const navegar = useNavigate();
  const fijarPredio = usoFlujo((e) => e.fijarPredio);
  const fijarLote = usoFlujo((e) => e.fijarLote);
  const [fichas, setFichas] = useState<FichaSueloLocal[]>([]);
  const [nombresPredio, setNombresPredio] = useState<Record<string, string>>({});
  const [analisisPorFicha, setAnalisisPorFicha] = useState<Record<number, number>>({});
  const [cargandoFichas, setCargandoFichas] = useState(false);
  const [mensajeFichas, setMensajeFichas] = useState('');
  const [eliminandoFicha, setEliminandoFicha] = useState<number | null>(null);
  useEffect(() => {
    if (paso !== 'fichas' && paso !== 'lectura') return;
    let vigente = true;
    setCargandoFichas(true);
    setMensajeFichas('');
    void Promise.all([
      baseDatos.fichasSuelo.toArray(),
      baseDatos.predios.toArray(),
      baseDatos.monitoreos.toArray(),
    ]).then(([fs, ps, ms]) => {
      if (!vigente) return;
      setFichas([...fs].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.version - a.version));
      setNombresPredio(Object.fromEntries(ps.map((p) => [p.identificador, p.nombre])));

      const conteo: Record<number, number> = {};
      for (const m of ms) if (m.fichaId !== undefined) conteo[m.fichaId] = (conteo[m.fichaId] ?? 0) + 1;
      setAnalisisPorFicha(conteo);
      setMensajeFichas(fs.length === 0 ? 'Aún no hay fichas guardadas. Registra un terreno y finaliza su caracterización.' : '');
    }).catch(() => {
      if (vigente) setMensajeFichas('No se pudo leer el caché local.');
    }).finally(() => {
      if (vigente) setCargandoFichas(false);
    });
    return () => { vigente = false; };
  }, [paso]);

  const abrirFicha = (f: FichaSueloLocal) => {
    fijarPredio(f.predioIdentificador);
    fijarLote(f.loteNombre ?? null);
    navegar(`/suelos?vista=lectura&version=${f.version}`);
  };
  const eliminarFicha = async (f: FichaSueloLocal) => {
    const fichaId = f.id;
    if (fichaId === undefined) return;
    const nombre = f.nombrePredio ?? nombresPredio[f.predioIdentificador] ?? f.predioIdentificador;
    if (!window.confirm(`¿Eliminar la ficha v${f.version} de ${nombre} (${f.fecha})? Se borran también sus fotos y monitoreos. No se puede deshacer.`)) return;
    setEliminandoFicha(fichaId);
    try {
      await baseDatos.fichasSuelo.delete(fichaId);
      await baseDatos.fotos.where('fichaId').equals(fichaId).delete();
      await baseDatos.monitoreos.where('fichaId').equals(fichaId).delete();
      setFichas((lista) => lista.filter((x) => x.id !== fichaId));
      setAnalisisPorFicha((conteo) => {
        const siguiente = { ...conteo };
        delete siguiente[fichaId];
        return siguiente;
      });
      setMensajeFichas(`Ficha v${f.version} eliminada.`);
      window.dispatchEvent(new Event(EVENTO_FICHAS_ACTUALIZADAS));
    } catch {
      setMensajeFichas('No se pudo eliminar la ficha del caché local.');
    } finally {
      setEliminandoFicha(null);
    }
  };
  const tieneRangos = (f: FichaSueloLocal) => RANGOS_VALIDADOS
    .some((r) => typeof f[r.parametro as keyof FichaSueloLocal] === 'number');

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

  const irAPaso = (p: Paso) => {
    setPaso(p);
    setIntroRegistro(false);
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
    setFinalizado(true);
    setMensaje(`Ficha v${version} guardada offline. Lo interpretado con rango validado aparece en Lectura; lo demás queda registrado sin interpretar.`);
  };

  // "Registrar y continuar": solo fecha, municipio, departamento y solicitante
  // son obligatorios. El resto se registra con lo que se haya ingresado.
  const [registrando, setRegistrando] = useState(false);
  const registrarYContinuar = async () => {
    if (registrando) return;
    setRegistrando(true);
    try {
      const datos = getValues();
      const validacion = esquemaFichaSuelo.safeParse(datos);
      const issues = validacion.success ? [] : validacion.error.issues;
      // Solo un valor inválido de este paso (ej. latitud fuera de rango) puede
      // frenar el registro; lo demás se corrige en su propio paso.
      const delTerreno = issues.filter((i) => CAMPOS_GENERALES.some((c) => c.nombre === i.path[0]));
      if (delTerreno.length > 0) {
        setNotaTerreno({
          texto: 'Completa los datos obligatorios o corrige los valores marcados.',
          detalle: delTerreno.map((i) => {
            const campo = CAMPOS_GENERALES.find((c) => c.nombre === i.path[0]);
            return `${campo?.etiqueta ?? String(i.path[0])}: ${i.message}`;
          }),
        });
        return;
      }
      await guardarTerreno(datos);
      setNotaTerreno(null);
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
  const categoriaActual = paso === 'fisicas' || paso === 'quimicas' || paso === 'biologicas'
    ? paso
    : null;

  return (
    <form onSubmit={handleSubmit(async (datos) => { if (paso !== 'resumen') return; await alGuardar(datos); })} className="ventana-ficha grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden w-full" style={{ background: 'var(--marca)', border: '1px solid var(--borde)', boxShadow: 'var(--sombra-suave)' }} aria-label="Caracterización del suelo">
      <header className="flex flex-wrap items-start justify-between gap-2 px-3 py-3 sm:px-5 sm:py-4" style={{ borderBottom: '1px solid var(--borde)' }}>
        <div className="grid min-w-0 gap-0.5">
          <h2 className="font-display text-2xl font-medium leading-tight" style={{ color: 'var(--marca-texto)' }}>Suelos</h2>
          <p className="max-w-[78ch] text-[12px] leading-relaxed" style={{ color: 'var(--marca-muted)' }}>
            Ficha de caracterización física, química y biológica por versiones. Cada guardado crea una nueva versión con fecha.
          </p>
        </div>
        <Link
          to="/"
          className="mono-micro inline-flex w-fit shrink-0 items-center gap-1.5 border px-3 py-2 transition-opacity hover:opacity-70"
          style={{ color: 'var(--marca-texto)', borderColor: 'var(--marca-muted)' }}
        >
          <span aria-hidden>←</span> Tablero
        </Link>
      </header>

      {/* Marco del wizard: ventana de contenido amplia con scroll interno */}
      <div className="grid min-h-0 min-w-0 p-2 sm:p-4">
      <div key={paso} className="animacion-entrada p-4 sm:p-5 grid gap-4 sm:gap-5 content-start overflow-y-auto min-h-0 scroll-sutil" style={{ background: 'var(--sup)' }} role="tabpanel" aria-label={PASOS.find((p) => p.id === paso)?.titulo ?? (paso === 'fichas' ? 'Terrenos registrados' : paso === 'lectura' ? 'Lectura del terreno' : undefined)}>
        {categoriaActual && (
          <ProgresoFicha
            categoria={categoriaActual}
            diapositiva={diapos[categoriaActual] ?? 0}
            valores={valores}
            tocadosVsa={tocadosVsa}
            alIrVariable={(i) => irAVariable(categoriaActual, i)}
            alIrResumen={() => irAPaso('resumen')}
          />
        )}
        {paso === 'bienvenida' && (
          introRegistro ? (
            <div className="grid gap-4 content-start" style={{ maxWidth: '62ch' }}>
              <span className="mono-micro" style={{ color: 'var(--acento)' }}>Registro de campo</span>
              <h2 className="font-display text-2xl sm:text-3xl font-medium leading-tight" style={{ color: 'var(--texto)' }}>
                Para empezar registra los datos del terreno a analizar
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Fecha, ubicación y condiciones del muestreo. Después abrirás la ficha para elegir qué dimensiones caracterizar.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Boton type="button" onClick={() => irAPaso('general')}>Registro</Boton>
                <BotonSecundario type="button" onClick={() => setIntroRegistro(false)}>Volver</BotonSecundario>
              </div>
            </div>
          ) : (
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
                <div className="flex flex-wrap items-center gap-2">
                  <Boton type="button" onClick={() => setIntroRegistro(true)}>Empezar</Boton>
                  <BotonSecundario type="button" onClick={() => irAPaso('fichas')}>Seleccionar terreno</BotonSecundario>
                </div>
              </div>
            </div>
          )
        )}

        {paso === 'fichas' && (
          <div className="grid gap-4">
            <div className="grid gap-1" style={{ maxWidth: '62ch' }}>
              <h2 className="font-display text-2xl font-medium" style={{ color: 'var(--texto)' }}>Terrenos registrados</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Fichas de los terrenos caracterizados y análisis generados. Elige una para abrir su lectura.
              </p>
            </div>
            {cargandoFichas && <p className="mensaje-info">Cargando fichas locales…</p>}
            {mensajeFichas && <p className="mensaje-info">{mensajeFichas}</p>}
            {fichas.length > 0 && (
              <ul className="grid gap-2">
                {fichas.map((f) => {
                  const analisis = f.id !== undefined ? (analisisPorFicha[f.id] ?? 0) : 0;
                  return (
                    <li key={f.id ?? `${f.predioIdentificador}-${f.fecha}-${f.version}`}>
                      <div
                        className="flex items-stretch"
                        style={{ background: 'var(--sup-2)', border: '1px solid var(--borde)' }}
                      >
                        <button
                          type="button"
                          onClick={() => abrirFicha(f)}
                          className="boton-campo flex-1 min-w-0 flex flex-wrap items-center gap-2 px-4 py-3 text-left transition-opacity hover:opacity-80"
                        >
                          <span className="font-semibold" style={{ color: 'var(--texto)' }}>
                            {f.nombrePredio ?? nombresPredio[f.predioIdentificador] ?? f.predioIdentificador}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>{f.loteNombre ?? 'Todo el predio'}</span>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>{f.fecha}</span>
                          <span className="mono-micro px-2 py-0.5" style={{ background: 'var(--acento-suave)', color: 'var(--acento)' }}>v{f.version}</span>
                          <span className="ml-auto flex flex-wrap items-center gap-2">
                            {tieneRangos(f)
                              ? <span className="text-[11px] font-semibold" style={{ color: 'var(--acento)' }}>Con análisis</span>
                              : <span className="text-[11px]" style={{ color: 'var(--faint)' }}>Sin análisis</span>}
                            {analisis > 0 && <span className="text-[11px] font-semibold" style={{ color: 'var(--tierra)' }}>VSA ×{analisis}</span>}
                            {!f.sincronizada && <span className="text-[11px] font-semibold" style={{ color: 'var(--tierra)' }}>Pendiente sync</span>}
                            <span aria-hidden style={{ color: 'var(--acento)' }}>→</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void eliminarFicha(f)}
                          disabled={eliminandoFicha === f.id}
                          title="Eliminar registro"
                          aria-label={`Eliminar la ficha v${f.version} de ${nombresPredio[f.predioIdentificador] ?? f.predioIdentificador} del ${f.fecha}`}
                          className="boton-campo shrink-0 grid place-items-center w-11 min-h-[44px] text-[color:var(--faint)] transition-colors hover:text-[#b91c1c] hover:bg-[#b91c1c]/10 disabled:opacity-40"
                          style={{ borderLeft: '1px solid var(--borde)' }}
                        >
                          <Icono id="eliminar" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {paso === 'lectura' && (
          <div className="grid gap-4">
            <div className="grid gap-1" style={{ maxWidth: '62ch' }}>
              <h2 className="font-display text-2xl font-medium" style={{ color: 'var(--texto)' }}>Lectura del terreno</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {nombresPredio[predioIdentificador] ?? predioIdentificador}
                {loteNombre ? ` · ${loteNombre}` : ' · Todo el predio'}
                {versionInicial !== undefined ? ` · ficha v${versionInicial}` : ''}
              </p>
            </div>
            <LecturaSuelo
              predioIdentificador={predioIdentificador}
              loteNombre={loteNombre}
              versionSeleccionada={versionInicial}
            />
          </div>
        )}

        {paso === 'general' && (
          <div className="grid gap-5">
            <Grupo titulo="Zona de estudio">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="etiqueta-campo"><span>Nombre del predio<Obligatorio /></span>
                  <input className="campo-entrada" placeholder="Ej: Finca La Esperanza" {...register('nombrePredio')} />
                </label>
                <label className="etiqueta-campo">Lote
                  <input className="campo-entrada" placeholder="Ej: Lote 3 / parcela norte" {...register('loteNombre')} />
                </label>
                <label className="etiqueta-campo">Vereda
                  <input className="campo-entrada" placeholder="Ej: El Mirador" {...register('vereda')} />
                </label>
                <label className="etiqueta-campo"><span>Municipio<Obligatorio /></span>
                  <input className="campo-entrada" placeholder="Ej: Tibasosa" {...register('municipio')} />
                </label>
                <label className="etiqueta-campo"><span>Departamento<Obligatorio /></span>
                  <input className="campo-entrada" placeholder="Ej: Boyacá" {...register('departamento')} />
                </label>
                <label className="etiqueta-campo"><span>Fecha de muestreo<Obligatorio /></span>
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
                <label className="etiqueta-campo"><span>Nombre del solicitante<Obligatorio /></span>
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
            {notaTerreno && (
              <div className="grid gap-1" role="alert">
                <p className="mensaje-error">{notaTerreno.texto}</p>
                {(notaTerreno.detalle ?? []).map((d) => (
                  <p key={d} className="mensaje-error">{d}</p>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => irAPaso('bienvenida')}
                className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
                style={{ background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
              >
                <span aria-hidden>←</span> Volver
              </button>
              <button
                type="button"
                onClick={() => void registrarYContinuar()}
                disabled={registrando}
                className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: 'var(--marca-texto)', color: 'var(--marca)' }}
              >
                Registrar y continuar <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        )}

        {paso === 'categorias' && (
          <div className="grid gap-4">
            <div className="grid gap-0.5">
              <h2 className="font-display text-2xl font-medium" style={{ color: 'var(--texto)' }}>Tipo de análisis</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Trabajando en {valores.nombrePredio || nombresPredio[predioIdentificador] || predioIdentificador}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:items-start">
              {CATEGORIAS_FICHA.map((c) => {
                const categoria = c.id;
                const r = categoria === 'completo'
                  ? (['fisicas', 'quimicas', 'biologicas'] as const).reduce(
                    (acc, cat) => {
                      const parcial = resumenVariables(cat, valores, cat === 'biologicas' ? conteosVsa : undefined);
                      return { registradas: acc.registradas + parcial.registradas, total: acc.total + parcial.total };
                    },
                    { registradas: 0, total: 0 },
                  )
                  : resumenVariables(categoria, valores, categoria === 'biologicas' ? conteosVsa : undefined);
                return (
                  <button
                    key={categoria}
                    type="button"
                    onClick={() => irAPaso(c.destino)}
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
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => irAPaso('bienvenida')}
                className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
                style={{ background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
              >
                <span aria-hidden>←</span> Inicio
              </button>
              <button
                type="button"
                onClick={() => irAPaso('general')}
                className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
                style={{ background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
              >
                <span aria-hidden>←</span> Modificar datos
              </button>
            </div>
          </div>
        )}

        {paso === 'fisicas' && (
          <PropiedadesFisicas
            registro={register}
            fijar={setValue}
            valores={valores}
            errorGranulometria={errors.arcillaPct?.message}
            alFoto={(f) => setFotosEtapa((v) => [...v, f])}
            alIrResumen={() => irAPaso('resumen')}
            alNavegar={(i) => setDiapos((d) => ({ ...d, fisicas: i }))}
            diapositiva={diapos.fisicas ?? null}
          />
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
        {paso !== 'bienvenida' && paso !== 'general' && paso !== 'categorias' && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1" role="group" aria-label="Navegación de la ficha">
            {paso === 'fichas' ? (
              <button
                type="button"
                onClick={() => irAPaso('bienvenida')}
                className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
                style={{ background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
              >
                <span aria-hidden>←</span> Volver al inicio
              </button>
            ) : paso === 'lectura' ? (
              <button
                type="button"
                onClick={() => navegar('/suelos?vista=fichas')}
                className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
                style={{ background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
              >
                <span aria-hidden>←</span> Volver a terrenos
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
                <button
                  type="button"
                  onClick={() => irIndice(indicePaso - 1)}
                  disabled={indicePaso === 0}
                  className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
                >
                  <span aria-hidden>←</span> Anterior
                </button>
                <button
                  type="button"
                  onClick={() => irIndice(indicePaso + 1)}
                  disabled={indicePaso === PASOS.length - 1}
                  className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'var(--marca)', color: 'var(--marca-texto)' }}
                >
                  Continuar <span aria-hidden>→</span>
                </button>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </form>
  );
}
