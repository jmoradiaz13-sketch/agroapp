export type InsigniaSig = 'OFFLINE' | 'MIXTO' | 'ONLINE';

export interface CapaSig {
  id: string;
  titulo: string;
  descripcion: string;
  insignia: InsigniaSig;
  fuente: string;
  pesoEstimado: string;
  disponible: boolean;
  grupo: 'igac' | 'relieve' | 'vegetacion';
}

export const CAPAS_SIG: CapaSig[] = [
  {
    id: 'igac-agrologia',
    titulo: 'Agrología IGAC',
    descripcion: 'Clases agrológicas y aptitud de suelos por polígono.',
    insignia: 'MIXTO',
    fuente: 'IGAC · Colombia en Mapas (WFS)',
    pesoEstimado: '~2 MB por predio',
    disponible: true,
    grupo: 'igac',
  },
  {
    id: 'igac-predial',
    titulo: 'Predial y veredas',
    descripcion: 'Límites prediales, veredas y municipios de referencia.',
    insignia: 'MIXTO',
    fuente: 'IGAC · Geoportal / Catastro',
    pesoEstimado: '~1 MB por predio',
    disponible: true,
    grupo: 'igac',
  },
  {
    id: 'pendiente',
    titulo: 'Pendiente por lote',
    descripcion: 'Pendiente % derivada del DEM, por zonas homogéneas.',
    insignia: 'MIXTO',
    fuente: 'Copernicus GLO-30 + gdaldem',
    pesoEstimado: '~4 MB por predio',
    disponible: true,
    grupo: 'relieve',
  },
  {
    id: 'rusle',
    titulo: 'Riesgo erosión (RUSLE)',
    descripcion: 'Pérdida estimada t/ha/año desde la pendiente DEM del lote.',
    insignia: 'MIXTO',
    fuente: 'DEM (LS) + ficha VSA/cobertura (C)',
    pesoEstimado: 'Cálculo en oficina',
    disponible: true,
    grupo: 'relieve',
  },
  {
    id: 'ndvi',
    titulo: 'NDVI satelital',
    descripcion: 'Salud vegetal Sentinel-2 (B8−B4)/(B8+B4), 10 m.',
    insignia: 'ONLINE',
    fuente: 'Copernicus Sentinel-2 L2A',
    pesoEstimado: '~8 MB por fecha/lote',
    disponible: true,
    grupo: 'vegetacion',
  },
];

export const FECHAS_NDVI = [
  { id: '2026-09-10', etiqueta: '10 sep 2026 · despejado hace 30 d' },
  { id: '2026-08-12', etiqueta: '12 ago 2026 · nubosidad parcial' },
  { id: '2026-07-15', etiqueta: '15 jul 2026 · referencia seca' },
];

export const LEYENDA_PENDIENTE = [
  { rango: '< 7 %', color: '#1b5e20', texto: 'Plano · mecanizable' },
  { rango: '7–25 %', color: '#f59e0b', texto: 'Ondulado · curvas a nivel' },
  { rango: '> 25 %', color: '#dc2626', texto: 'Empinado · cobertura permanente' },
];

export const LEYENDA_NDVI = [
  { rango: '< 0,3', color: '#dc2626', texto: 'Suelo desnudo / estrés' },
  { rango: '0,3–0,6', color: '#f59e0b', texto: 'Transición · verificar' },
  { rango: '> 0,6', color: '#1b5e20', texto: 'Vigoroso' },
];
