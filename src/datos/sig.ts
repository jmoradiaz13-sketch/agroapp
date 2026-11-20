export type InsigniaSig = 'OFFLINE' | 'MIXTO' | 'ONLINE';
export type BaseMapa = 'osm' | 'topo' | 'satelite';
export type CapaWms = 'agrologia' | 'predial';

export interface CapaSig {
  id: string;
  titulo: string;
  descripcion: string;
  insignia: InsigniaSig;
  fuente: string;
  pesoEstimado: string;
  disponible: boolean;
  grupo: 'igac' | 'relieve' | 'vegetacion' | 'upra';
  tipo: 'mapa' | 'analisis';
  capaWms?: CapaWms;
}

export interface MapaBase {
  id: BaseMapa;
  titulo: string;
  descripcion: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdominios?: string;
}

export const BASES_MAPA: MapaBase[] = [
  {
    id: 'osm',
    titulo: 'Calles',
    descripcion: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
  {
    id: 'topo',
    titulo: 'Relieve',
    descripcion: 'Esri World Topographic Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri · HERE · Garmin · OpenStreetMap',
    maxZoom: 19,
  },
  {
    id: 'satelite',
    titulo: 'Satélite',
    descripcion: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri · Maxar · Earthstar Geographics',
    maxZoom: 19,
  },
];

export const CAPAS_SIG: CapaSig[] = [
  {
    id: 'igac-agrologia',
    titulo: 'Agrología IGAC 1:100.000',
    descripcion: 'Órdenes de suelos y correlación agrológica nacional.',
    insignia: 'MIXTO',
    fuente: 'IGAC · Suelos y Tierras de Colombia 2016',
    pesoEstimado: '~2 MB por predio',
    disponible: true,
    grupo: 'igac',
    tipo: 'mapa',
    capaWms: 'agrologia',
  },
  {
    id: 'igac-predial',
    titulo: 'Catastro rural IGAC',
    descripcion: 'Terrenos rurales catastrales; cobertura parcial por municipio.',
    insignia: 'MIXTO',
    fuente: 'IGAC · Dato Fundamental Catastro (R_TERRENO)',
    pesoEstimado: '~1 MB por predio',
    disponible: true,
    grupo: 'igac',
    tipo: 'mapa',
    capaWms: 'predial',
  },
  {
    id: 'pendiente',
    titulo: 'Pendiente por lote',
    descripcion: 'Análisis DEM por lote; se activa desde las herramientas.',
    insignia: 'MIXTO',
    fuente: 'Copernicus GLO-30 + gdaldem',
    pesoEstimado: 'Cálculo en oficina',
    disponible: false,
    grupo: 'relieve',
    tipo: 'analisis',
  },
  {
    id: 'rusle',
    titulo: 'Riesgo erosión (RUSLE)',
    descripcion: 'Pérdida estimada t/ha/año desde la pendiente DEM del lote.',
    insignia: 'MIXTO',
    fuente: 'DEM (LS) + ficha VSA/cobertura (C)',
    pesoEstimado: 'Cálculo en oficina',
    disponible: false,
    grupo: 'relieve',
    tipo: 'analisis',
  },
  {
    id: 'ndvi',
    titulo: 'NDVI satelital',
    descripcion: 'Serie demo mientras se integra Sentinel-2 real; se consulta aparte.',
    insignia: 'ONLINE',
    fuente: 'Copernicus Sentinel-2 L2A (demo)',
    pesoEstimado: '~8 MB por fecha/lote',
    disponible: false,
    grupo: 'vegetacion',
    tipo: 'analisis',
  },
  {
    id: 'upra-frontera',
    titulo: 'Frontera agrícola UPRA',
    descripcion: 'Consulta tabular del municipio; no se dibuja como capa.',
    insignia: 'MIXTO',
    fuente: 'UPRA · datos.gov.co fyc7-sbtz',
    pesoEstimado: 'Dato tabular, sin peso',
    disponible: false,
    grupo: 'upra',
    tipo: 'analisis',
  },
  {
    id: 'upra-aptitud',
    titulo: 'Aptitud A1/A2/A3 (SIPRA)',
    descripcion: 'Consulta por cultivo en SIPRA; dato indicativo, no predial.',
    insignia: 'ONLINE',
    fuente: 'UPRA · SIPRA',
    pesoEstimado: 'Enlace externo',
    disponible: false,
    grupo: 'upra',
    tipo: 'analisis',
  },
];

// Serie demo explícita: no representa una consulta Sentinel-2 en vivo.
export const FECHAS_NDVI = [
  { id: 'demo-2026-09-10', etiqueta: '10 sep 2026 · demo despejado' },
  { id: 'demo-2026-08-12', etiqueta: '12 ago 2026 · demo nubosidad parcial' },
  { id: 'demo-2026-07-15', etiqueta: '15 jul 2026 · demo referencia seca' },
];

export const LEYENDA_GEOMETRIAS = [
  { color: '#14736e', texto: 'Predio delimitado' },
  { color: '#f59e0b', texto: 'Lote seleccionado' },
  { color: '#2f855a', texto: 'Lote guardado' },
  { color: '#b45309', texto: 'Borrador en edición' },
];

export const LEYENDA_PENDIENTE = [
  { rango: '< 7 %', color: '#14736E', texto: 'Plano · mecanizable' },
  { rango: '7–25 %', color: '#f59e0b', texto: 'Ondulado · curvas a nivel' },
  { rango: '> 25 %', color: '#dc2626', texto: 'Empinado · cobertura permanente' },
];

export const LEYENDA_NDVI = [
  { rango: '< 0,3', color: '#dc2626', texto: 'Suelo desnudo / estrés' },
  { rango: '0,3–0,6', color: '#f59e0b', texto: 'Transición · verificar' },
  { rango: '> 0,6', color: '#14736E', texto: 'Vigoroso' },
];
