import { GRUPOS_NAV, rutaBase, type ItemNav } from './navegacion';
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

export interface EscenaGrupo extends Escena {
  items: ItemNav[];
}

// Color-espacio por frente de operación: cada tarjeta del Tablero lleva su
// banda para reconocer el territorio de un vistazo.
export const COLOR_POR_GRUPO: Record<string, { color: string; sobre: string }> = {
  suelos: { color: '#14736E', sobre: '#F2E9D8' },
  sig: { color: '#5A6B3D', sobre: '#F2E9D8' },
  planificacion: { color: '#F28C18', sobre: '#0B2F31' },
};

const DETALLE_GRUPO: Record<string, { imagen: string; etapa: string; insignia: InsigniaConectividad }> = {
  planificacion: { imagen: '/imagenes/2.jpg', etapa: 'Frente 1 · Finca', insignia: 'OFFLINE' },
  suelos: { imagen: '/imagenes/3.jpg', etapa: 'Frente 2 · Suelos', insignia: 'MIXTO' },
  sig: { imagen: '/imagenes/5.jpg', etapa: 'Frente 3 · Territorio', insignia: 'MIXTO' },
};

// Metadatos de cada submenú para el marco de escena (hero con imagen y
// migas ← Tablero) y para el Tablero de tres frentes.
const DETALLE_ITEM: Record<string, { descripcion: string; imagen: string; etapa: string; insignia: InsigniaConectividad }> = {
  ficha: { descripcion: 'Ficha VSA, historial inmutable y lectura del suelo en un solo lugar.', imagen: '/imagenes/3.jpg', etapa: 'Suelos · Muestreo', insignia: 'MIXTO' },
  fichas: { descripcion: 'Terrenos con fichas registradas, versiones y estado de sincronización.', imagen: '/imagenes/3.jpg', etapa: 'Suelos · Registro', insignia: 'MIXTO' },
  lectura: { descripcion: 'Interpretación del análisis y diagnóstico de las propiedades del suelo.', imagen: '/imagenes/3.jpg', etapa: 'Suelos · Lectura', insignia: 'OFFLINE' },
  biblioteca: { descripcion: 'Guías paso a paso y videos para aprender en campo.', imagen: '/imagenes/1.jpg', etapa: 'Suelos · Aprende', insignia: 'OFFLINE' },
  sig: { descripcion: 'Predio, lotes y puntos sobre capas oficiales IGAC. Edición offline y precarga para campo.', imagen: '/imagenes/5.jpg', etapa: 'SIG · Taller', insignia: 'MIXTO' },
  analisis: { descripcion: 'Pendiente DEM, RUSLE, NDVI satelital y frontera agrícola UPRA.', imagen: '/imagenes/5.jpg', etapa: 'SIG · Análisis', insignia: 'MIXTO' },
  predios: { descripcion: 'Registra el predio, su propietario y elige con cuál trabajar.', imagen: '/imagenes/2.jpg', etapa: 'Fincas · Predio', insignia: 'OFFLINE' },
  lote: { descripcion: 'Delimita lotes y zonifica sobre el mapa con GPS.', imagen: '/imagenes/5.jpg', etapa: 'Fincas · Lotes', insignia: 'OFFLINE' },
  simulador: { descripcion: 'Escenarios A/B/C de sistemas: compatibilidad, costos y RUSLE.', imagen: '/imagenes/4.jpg', etapa: 'Fincas · Plan', insignia: 'MIXTO' },
  diseno: { descripcion: 'Diseña arreglos agroforestales con especies nativas.', imagen: '/imagenes/2.jpg', etapa: 'Fincas · Diseño', insignia: 'OFFLINE' },
  informe: { descripcion: 'Informe técnico en PDF listo para entregar al productor.', imagen: '/imagenes/1.jpg', etapa: 'Fincas · Cierre', insignia: 'MIXTO' },
};

// Catálogo del Tablero: tres tarjetas, una por frente, con sus submenús.
export const ESCENAS: EscenaGrupo[] = GRUPOS_NAV.map((g) => {
  const color = COLOR_POR_GRUPO[g.id];
  const detalle = DETALLE_GRUPO[g.id];
  return {
    id: g.id,
    ruta: g.ruta,
    titulo: g.titulo,
    descripcion: g.descripcion,
    imagen: detalle?.imagen ?? '/imagenes/2.jpg',
    icono: g.icono,
    grupo: g.titulo,
    etapa: detalle?.etapa ?? '',
    insignia: detalle?.insignia ?? 'OFFLINE',
    color: color?.color ?? '#0B2F31',
    sobre: color?.sobre ?? '#F2E9D8',
    items: g.items,
  };
});

// Una escena por ruta real para el marco de escena. La primera coincidencia
// manda (p. ej. /sig conserva el hero de «Mapa y capas»).
export const ESCENA_POR_RUTA: Record<string, Escena> = GRUPOS_NAV.flatMap((g) => {
  const color = COLOR_POR_GRUPO[g.id];
  return g.items.map((m) => {
    const detalle = DETALLE_ITEM[m.id];
    return {
      base: rutaBase(m.ruta),
      escena: {
        id: m.id,
        ruta: rutaBase(m.ruta),
        titulo: m.titulo,
        descripcion: detalle?.descripcion ?? m.descripcion,
        imagen: detalle?.imagen ?? '/imagenes/2.jpg',
        icono: m.icono,
        grupo: g.titulo,
        etapa: detalle?.etapa ?? '',
        insignia: detalle?.insignia ?? 'OFFLINE',
        color: color?.color ?? '#0B2F31',
        sobre: color?.sobre ?? '#F2E9D8',
      },
    };
  });
}).reduce<Record<string, Escena>>((acc, { base, escena }) => {
  if (!acc[base]) acc[base] = escena;
  return acc;
}, {});
