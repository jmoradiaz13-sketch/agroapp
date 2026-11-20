// Navegación delimitada a los tres frentes de operación del sitio:
// Suelos, Herramientas SIG y Planificación de fincas. Cada frente agrupa
// sus submenús por categorías; la barra superior y el menú móvil los
// despliegan, y el Tablero resume los tres con sus accesos directos.
import type { IconoId } from '../componentes/Iconos';

export interface ItemNav {
  id: string;
  ruta: string;
  titulo: string;
  icono: IconoId;
  categoria: string;
  descripcion: string;
}

export interface GrupoNav {
  id: string;
  titulo: string;
  corto: string;
  ruta: string;
  icono: IconoId;
  descripcion: string;
  items: ItemNav[];
}

const SUELOS: ItemNav[] = [
  {
    id: 'ficha',
    ruta: '/suelos?vista=ficha',
    titulo: 'Registrar ficha',
    icono: 'suelos',
    categoria: 'Muestreo y análisis',
    descripcion: 'Registra la muestra de campo y sus propiedades físicas, químicas y biológicas.',
  },
  {
    id: 'fichas',
    ruta: '/suelos?vista=fichas',
    titulo: 'Terrenos registrados',
    icono: 'lotes',
    categoria: 'Muestreo y análisis',
    descripcion: 'Consulta las fichas guardadas por predio y lote.',
  },
  {
    id: 'lectura',
    ruta: '/suelos?vista=lectura',
    titulo: 'Lectura del suelo',
    icono: 'diagnostico',
    categoria: 'Muestreo y análisis',
    descripcion: 'Interpreta el análisis y genera el diagnóstico del suelo.',
  },
  {
    id: 'biblioteca',
    ruta: '/biblioteca',
    titulo: 'Biblioteca de guías',
    icono: 'biblioteca',
    categoria: 'Aprende',
    descripcion: 'Guías paso a paso para muestrear y leer el suelo.',
  },
];

const HERRAMIENTAS_SIG: ItemNav[] = [
  {
    id: 'sig',
    ruta: '/sig#mapa',
    titulo: 'Mapa y capas',
    icono: 'sig',
    categoria: 'Taller SIG',
    descripcion: 'Delimita, consulta capas IGAC y edita en campo.',
  },
  {
    id: 'analisis',
    ruta: '/sig#analisis',
    titulo: 'Análisis territorial',
    icono: 'diagnostico',
    categoria: 'Taller SIG',
    descripcion: 'Pendiente, RUSLE, NDVI y frontera agrícola.',
  },
];

const PLANIFICACION: ItemNav[] = [
  {
    id: 'predios',
    ruta: '/predios',
    titulo: 'Predios',
    icono: 'predios',
    categoria: 'Finca',
    descripcion: 'Registra el predio, su propietario y su vocación.',
  },
  {
    id: 'lote',
    ruta: '/lote',
    titulo: 'Lotes',
    icono: 'lotes',
    categoria: 'Finca',
    descripcion: 'Delimita lotes y caracterízalos sobre el mapa.',
  },
  {
    id: 'simulador',
    ruta: '/simulador',
    titulo: 'Simulador',
    icono: 'simulador',
    categoria: 'Plan',
    descripcion: 'Compara escenarios A/B/C con costos y RUSLE.',
  },
  {
    id: 'diseno',
    ruta: '/diseno',
    titulo: 'Diseño SAF',
    icono: 'diseno',
    categoria: 'Plan',
    descripcion: 'Diseña arreglos agroforestales con especies nativas.',
  },
  {
    id: 'informe',
    ruta: '/informe',
    titulo: 'Informe',
    icono: 'informe',
    categoria: 'Cierre',
    descripcion: 'Genera el informe técnico en PDF para el productor.',
  },
];

export const GRUPOS_NAV: GrupoNav[] = [
  {
    id: 'planificacion',
    titulo: 'Planificación de fincas',
    corto: 'Fincas',
    ruta: '/predios',
    icono: 'predios',
    descripcion: 'Gestiona predios, lotes y el plan agroforestal de la finca.',
    items: PLANIFICACION,
  },
  {
    id: 'suelos',
    titulo: 'Suelos',
    corto: 'Suelos',
    ruta: '/suelos?vista=ficha',
    icono: 'suelos',
    descripcion: 'Interpreta análisis de suelos y registra muestras tomadas en campo.',
    items: SUELOS,
  },
  {
    id: 'sig',
    titulo: 'Herramientas SIG',
    corto: 'SIG',
    ruta: '/sig',
    icono: 'sig',
    descripcion: 'Cruza la finca con capas oficiales y modelos territoriales.',
    items: HERRAMIENTAS_SIG,
  },
];

export function rutaBase(ruta: string): string {
  return ruta.split(/[?#]/)[0];
}

export function grupoDeRuta(pathname: string): GrupoNav | undefined {
  return GRUPOS_NAV.find((g) =>
    g.items.some((m) => {
      const base = rutaBase(m.ruta);
      return pathname === base || pathname.startsWith(`${base}/`);
    }),
  );
}

export const TITULOS_RUTA: Record<string, string> = {
  '/': 'Tablero',
  '/predios': 'Predios',
  '/lote': 'Lotes',
  '/suelos': 'Suelos',
  '/sig': 'Herramientas SIG',
  '/simulador': 'Simulador',
  '/diseno': 'Diseño SAF',
  '/informe': 'Informe',
  '/ingreso': 'Ingreso',
  '/biblioteca': 'Biblioteca',
};
