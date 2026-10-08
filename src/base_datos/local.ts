import Dexie, { type Table } from 'dexie';

// Tipos en español, coordenadas cliente en WGS84 (EPSG:4326) según AGENTS.md.
export interface PredioLocal {
  id?: number;
  identificador: string;
  nombre: string;
  propietario?: string;
  documento?: string;
  contacto?: string;
  municipio?: string;
  departamento?: string;
  areaTotalHa?: number;
  notas?: string;
  geometria: GeoJSON.Polygon; // siempre EPSG:4326 en cliente
  fechaActualizacion: string; // ISO
  tamanoCacheBytes: number; // control límite 200 MB por predio
  estadoSincronizacion?: 'pendiente' | 'sincronizado' | 'conflicto';
}

export interface LoteLocal {
  id?: number;
  predioIdentificador: string;
  nombre: string;
  areaHa?: number;
  geometria: GeoJSON.Polygon;
  usoActual?: string;
  usosHistoricos?: string[];
  pendientePct?: number;
  cobertura?: string;
  clima?: string;
  zonaVida?: string;
  erosion?: string;
  notas?: string;
  fechaActualizacion: string;
  estadoSincronizacion?: 'pendiente' | 'sincronizado' | 'conflicto';
}

export interface MonitoreoLocal {
  id?: number;
  loteNombre: string;
  fecha: string;
  indicadores: Record<string, number | string>;
  observaciones?: string;
  sincronizada: boolean;
}

export interface EstrategiaLocal {
  id?: number;
  loteNombre: string;
  tipo: 'agroforesteria' | 'rotacion' | 'cobertura' | 'restauracion';
  especies: string[];
  practicas?: string;
  estado: 'propuesta' | 'aprobada' | 'implementada' | 'en_monitoreo';
  version: number;
  referenciaBibliografica: string;
  decisionTecnico?: 'aceptada' | 'rechazada' | 'editada';
  sincronizada: boolean;
}

export interface FichaSueloLocal {
  id?: number;
  predioIdentificador: string;
  fecha: string; // serie temporal, nunca se sobrescribe
  version: number;
  // Unidades almacenamiento: cmol/kg, mg/kg, %, dS/m (pH sin unidad)
  tipoEvaluacion?: 'campo' | 'laboratorio' | 'mixta';
  climaReciente?: string;
  profundidadCm?: number;
  laboratorio?: string;
  // Físicas
  texturaTacto?: string;
  compactacion?: string;
  infiltracion?: string;
  estructuraDesc?: string;
  densidadAparente?: number;
  porosidadPct?: number;
  capacidadCampoPct?: number;
  pmpPct?: number;
  colorMunsell?: string;
  profundidadEfectivaCm?: number;
  // Químicas campo
  phCampo?: number;
  ceCampo?: number;
  carbonatos?: string;
  sintomasVisuales?: string;
  // Químicas laboratorio
  phAgua?: number;
  phKcl?: number;
  calcioCmolKg?: number;
  magnesioCmolKg?: number;
  potasioCmolKg?: number;
  sodioCmolKg?: number;
  aluminioCmolKg?: number;
  saturacionAlPct?: number;
  cicCmolKg?: number;
  fosforoMgKg?: number;
  azufreMgKg?: number;
  materiaOrganicaPct?: number;
  nitrogenoPct?: number;
  conductividadDsM?: number;
  hierroMgKg?: number;
  manganesoMgKg?: number;
  zincMgKg?: number;
  cobreMgKg?: number;
  boroMgKg?: number;
  arenaPct?: number;
  limoPct?: number;
  arcillaPct?: number;
  // Biológicas
  lombricesConteo?: number;
  nodulacion?: string;
  olorSuelo?: string;
  descomposicionMo?: string;
  respiracionSuelo?: number;
  carbonoBiomasa?: number;
  micorrizas?: string;
  coberturaVegetalPct?: number;
  referenciaBibliografica: string; // trazabilidad a src/*.pdf
  sincronizada: boolean;
}

export interface CapaIgacLocal {
  id?: number;
  predioIdentificador: string;
  nombreCapa: string;
  geojson: GeoJSON.Geometry;
  fechaActualizacion: string;
}

export interface GeotiffCache {
  id?: number;
  predioIdentificador: string;
  tipo: 'DEM' | 'NDVI' | 'NDMI' | 'BSI' | 'PENDIENTE';
  blob: Blob;
  fechaActualizacion: string;
  tamanoBytes: number;
}

export const LIMITE_CACHE_PREDIO_BYTES = 200 * 1024 * 1024;

class BaseDatosAgroApp extends Dexie {
  predios!: Table<PredioLocal, number>;
  fichasSuelo!: Table<FichaSueloLocal, number>;
  capasIgac!: Table<CapaIgacLocal, number>;
  geotiffs!: Table<GeotiffCache, number>;
  lotes!: Table<LoteLocal, number>;
  monitoreos!: Table<MonitoreoLocal, number>;
  estrategias!: Table<EstrategiaLocal, number>;

  constructor() {
    super('agroapp_campo');
    this.version(1).stores({
      predios: '++id, identificador, fechaActualizacion',
      fichasSuelo: '++id, predioIdentificador, fecha, version'
    });
    // Fase 2 offline: MIXTO (IGAC/DEM) + ONLINE (NDVI) cacheados para uso offline posterior
    this.version(2).stores({
      capasIgac: '++id, predioIdentificador, nombreCapa',
      geotiffs: '++id, predioIdentificador, tipo'
    });
    // MVP visible: lotes, monitoreos y estrategias con sync LWW
    this.version(3).stores({
      lotes: '++id, predioIdentificador, nombre',
      monitoreos: '++id, loteNombre, fecha',
      estrategias: '++id, loteNombre, tipo'
    });
  }
}

export const baseDatos = new BaseDatosAgroApp();

export function etiquetaCache(fechaISO: string): string {
  return `Caché local - actualizado el ${fechaISO}`;
}

export async function tamanoCachePredio(predioIdentificador: string): Promise<number> {
  const predio = await baseDatos.predios.where('identificador').equals(predioIdentificador).first();
  const base = predio?.tamanoCacheBytes ?? 0;
  const geotiffs = await baseDatos.geotiffs.where('predioIdentificador').equals(predioIdentificador).toArray();
  return base + geotiffs.reduce((acc, g) => acc + g.tamanoBytes, 0);
}
