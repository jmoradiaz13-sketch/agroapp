import { GRUPOS_NAV } from './navegacion';
import type { IconoId } from '../componentes/Iconos';

export type InsigniaConectividad = 'OFFLINE' | 'MIXTO' | 'ONLINE';

export interface Escena {
  id: string;
  ruta: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  icono: IconoId;
  grupo: string;
  etapa: string;
  insignia: InsigniaConectividad;
  color: string;
  sobre: string;
}

// Color-espacio por grupo (placeholder hasta las fotos definitivas):
// cada tarjeta lleva su banda para reconocer el territorio de un vistazo.
const COLOR_POR_GRUPO: Record<string, { color: string; sobre: string }> = {
  Finca: { color: '#0B2F31', sobre: '#F2E9D8' },
  Suelo: { color: '#14736E', sobre: '#F2E9D8' },
  Territorio: { color: '#5A6B3D', sobre: '#F2E9D8' },
  Plan: { color: '#F28C18', sobre: '#0B2F31' },
  Aprende: { color: '#F6B23D', sobre: '#0B2F31' },
};

// Catálogo del Tablero (choice board): cada escena es un punto de entrada
// con foto, promesa y modo de conectividad. El estado vivo (fichas, lotes…)
// lo calcula el Tablero desde Dexie.
const DETALLE: Record<string, { descripcion: string; imagen: string; etapa: string; insignia: InsigniaConectividad }> = {
  predios: { descripcion: 'Registra el predio, su propietario y elige con cuál trabajar.', imagen: '/imagenes/2.jpg', etapa: 'Etapa 1 · Predio', insignia: 'OFFLINE' },
  lote: { descripcion: 'Delimita lotes y zonifica sobre el mapa con GPS.', imagen: '/imagenes/5.jpg', etapa: 'Etapa 2 · Lotes', insignia: 'OFFLINE' },
  ficha: { descripcion: 'Evaluación visual VSA en campo + ficha de laboratorio inmutable.', imagen: '/imagenes/3.jpg', etapa: 'Etapa 3 · Suelos', insignia: 'OFFLINE' },
  diagnostico: { descripcion: 'Salud del suelo 0-100, erosión RUSLE y enmiendas con cita.', imagen: '/imagenes/4.jpg', etapa: 'Etapa 5 · Diagnóstico', insignia: 'MIXTO' },
  sig: { descripcion: 'Capas IGAC, pendiente DEM, NDVI satelital y frontera UPRA.', imagen: '/imagenes/5.jpg', etapa: 'Etapa 4 · SIG', insignia: 'MIXTO' },
  simulador: { descripcion: 'Escenarios A/B/C de sistemas: compatibilidad, costos y RUSLE.', imagen: '/imagenes/4.jpg', etapa: 'Etapa 6 · Plan', insignia: 'MIXTO' },
  diseno: { descripcion: 'Diseña arreglos agroforestales con especies nativas.', imagen: '/imagenes/2.jpg', etapa: 'Etapa 6 · Diseño', insignia: 'OFFLINE' },
  informe: { descripcion: 'Informe técnico en PDF listo para entregar al productor.', imagen: '/imagenes/1.jpg', etapa: 'Etapa 7 · Cierre', insignia: 'MIXTO' },
  biblioteca: { descripcion: 'Guías paso a paso y videos para aprender en campo.', imagen: '/imagenes/1.jpg', etapa: 'Siempre · Aprende', insignia: 'OFFLINE' },
};

export const ESCENAS: Escena[] = GRUPOS_NAV.flatMap((g) =>
  g.items.map((m) => ({
    id: m.id,
    ruta: m.ruta,
    titulo: m.titulo,
    descripcion: DETALLE[m.id]?.descripcion ?? '',
    imagen: DETALLE[m.id]?.imagen ?? '/imagenes/2.jpg',
    icono: m.icono,
    grupo: g.titulo,
    etapa: DETALLE[m.id]?.etapa ?? '',
    insignia: DETALLE[m.id]?.insignia ?? 'OFFLINE',
    color: COLOR_POR_GRUPO[g.titulo]?.color ?? '#0B2F31',
    sobre: COLOR_POR_GRUPO[g.titulo]?.sobre ?? '#F2E9D8',
  })),
);

export const ESCENA_POR_RUTA: Record<string, Escena> = Object.fromEntries(ESCENAS.map((e) => [e.ruta, e]));
