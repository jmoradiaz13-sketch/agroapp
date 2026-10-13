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
  tenencia?: string; // propiedad|arrendamiento|sucesion|otro (Etapa 1)
  vocacion?: string; // cafe|ganaderia|cacao|policultivo|otro
  manoObraFamiliar?: number;
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
  // Sitio de muestreo (Datos del terreno)
  latitud?: number;
  longitud?: number;
  precisionM?: number;
  msnm?: number;
  pendienteSitioPct?: number;
  posicionRelieve?: 'cima' | 'hombro' | 'ladera' | 'pie' | 'valle';
  usoActual?: string;
  solicitante?: string;
  tenenciaSitio?: 'propietario' | 'arrendatario' | 'poseedor' | 'otro';
  manejoReciente?: string;
  vereda?: string;
  municipio?: string;
  departamento?: string;
  // Físicas
  texturaTacto?: string;
  compactacion?: string;
  infiltracion?: string;
  estructuraDesc?: string;
  estructuraVess?: number;
  densidadAparente?: number;
  densidadReal?: number; // g/cm³ picnómetro (Etapa 3)
  porosidadPct?: number;
  capacidadCampoPct?: number;
  pmpPct?: number;
  colorMunsell?: string;
  munsellH?: string;
  munsellV?: number;
  munsellC?: number;
  colorEstado?: string;
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
  metodoFosforo?: string; // Bray II|Olsen|otro
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
  referenciaBibliografica?: string; // fuente registrada (opcional)
  sincronizada: boolean;
}

export interface UsoSueloDiseno {
  uso: string;
  porcentaje: number;
}

export interface ComponenteDiseno {
  rol: string;
  especie: string;
  detalle?: string;
}

export interface DisenoLocal {
  id?: number;
  predioIdentificador: string; // 'sin-predio' cuando se simula desde cero
  loteNombre?: string;
  nombreUnidad: string;
  fecha: string;
  version: number;
  areaTotalHa?: number;
  zonaClima?: string;
  objetivo?: string;
  tipoDiseno?: string;
  nivelTransicion?: number; // 1-4 Gliessman
  usosSuelo: UsoSueloDiseno[];
  componentes: ComponenteDiseno[];
  rotacionAsociacion?: string;
  referenciaBibliografica?: string; // opcional en el simulador
  sincronizada: boolean;
}

export interface EspecieLocal {
  id?: number;
  nombreComun: string;
  nombreCientifico?: string;
  rol: string; // rol funcional: sombrío, fijadora de N, cobertura…
  estrato?: string; // alto, medio, bajo, suelo
  ciclo?: string; // perenne, anual, bianual
  phMin?: number;
  phMax?: number;
  moMinPct?: number;
  texturas?: string[]; // arenoso, franco, arcilloso, limoso
  pendienteMaxPct?: number;
  zonaVida?: string; // o 'todas'
  aporte?: string;
  referenciaBibliografica: string; // obligatoria: cero invención
  origen?: 'base' | 'tecnico';
  sincronizada: boolean;
}

export interface EscenarioLocal {
  id?: number;
  predioIdentificador: string;
  loteNombre?: string;
  nombre: string; // A productivo, B restauración, C integrado
  tipo: 'A' | 'B' | 'C';
  usosSuelo: UsoSueloDiseno[];
  componentes: ComponenteDiseno[];
  rotacion?: string;
  coberturaAno5?: number;
  rusleAntes?: number;
  rusleDespues?: number;
  referenciaBibliografica: string;
  fecha: string;
  sincronizada: boolean;
}

export interface FotoLocal {
  id?: number;
  fichaId?: number; // local; se resuelve al sincronizar por predio+versión
  predioIdentificador: string;
  loteNombre?: string;
  tipo: 'muestra' | 'vess' | 'cobertura' | 'punto';
  foto: Blob;
  miniatura: Blob;
  lat?: number;
  lng?: number;
  coberturaPct?: number;
  fecha: string;
  sincronizada: boolean;
}

export interface PuntoMuestreoLocal {
  id?: number;
  predioIdentificador: string;
  loteNombre?: string;
  codigo: string; // MU-AAAAMMDD-nn
  lat: number;
  lng: number;
  fecha: string;
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
  disenos!: Table<DisenoLocal, number>;
  fotos!: Table<FotoLocal, number>;
  puntosMuestreo!: Table<PuntoMuestreoLocal, number>;
  especies!: Table<EspecieLocal, number>;
  escenarios!: Table<EscenarioLocal, number>;

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
    // Simulador de diseño agroecológico: diseños versionados por unidad
    this.version(4).stores({
      disenos: '++id, predioIdentificador, fecha, version'
    });
    // Fase A campo con fotos: fotos por ficha/muestra + puntos GPS de muestreo
    this.version(5).stores({
      fotos: '++id, fichaId, predioIdentificador, tipo',
      puntosMuestreo: '++id, predioIdentificador, codigo'
    });
    // Simulador: banco abierto de especies + escenarios A/B/C versionados
    this.version(6).stores({
      especies: '++id, nombreCientifico',
      escenarios: '++id, predioIdentificador, fecha'
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
