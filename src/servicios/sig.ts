// Cliente SIG Fase 1: habla con /sig del backend (oficina online),
// con fallback offline honesto para campo sin red.
const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

export const BBOX_PREDETERMINADO = '-74.06,4.63,-74.03,4.66';

// Base WMS IGAC (misma que el backend). El mapa la usa como teselas;
// la copia GeoJSON precargada en Dexie cubre el campo offline.
export const WMS_IGAC = {
  url: 'https://mapas2.igac.gov.co/server/services/carto/carto1000lavega25402000/MapServer/WMSServer',
  capa: 'carto1000lavega25402000',
};

export interface PlanPrecarga {
  predio: string;
  peso_total_mb: number;
  cabe_en_cache: boolean;
  pasos: string[];
  fuentes: string;
}

export async function solicitarPrecarga(
  predioIdentificador: string,
  bbox: string,
  capas: string[],
): Promise<{ ok: boolean; plan?: PlanPrecarga; error?: string }> {
  try {
    const r = await fetch(`${URL_API}/sig/precarga`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predio_identificador: predioIdentificador, bbox, capas }),
    });
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    return { ok: true, plan: (await r.json()) as PlanPrecarga };
  } catch {
    return { ok: false, error: 'Sin conexión: anota las capas y precarga con wifi en oficina.' };
  }
}

export async function clasificarPendiente(
  predioIdentificador: string,
  pendientePct?: number,
): Promise<{ clase?: string; manejo?: string; error?: string }> {
  try {
    const url = new URL(`${URL_API}/analisis/pendiente-rusle`);
    url.searchParams.set('predio_identificador', predioIdentificador);
    if (pendientePct !== undefined) url.searchParams.set('pendiente_pct', String(pendientePct));
    const r = await fetch(url.toString());
    if (!r.ok) return { error: `Error ${r.status}` };
    return (await r.json()) as { clase?: string; manejo?: string };
  } catch {
    return { error: 'Sin conexión: usa la guía local < 7 / 7–25 / > 25 %.' };
  }
}

export async function obtenerGeojsonIgac(
  capa: string,
  bbox: string,
  modo: 'real' | 'demo' = 'real',
): Promise<{ ok: boolean; geojson?: unknown; error?: string }> {
  try {
    const url = new URL(`${URL_API}/sig/igac/geojson`);
    url.searchParams.set('capa', capa);
    url.searchParams.set('bbox', bbox);
    url.searchParams.set('modo', modo);
    const r = await fetch(url.toString());
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    const cuerpo = (await r.json()) as { geojson?: unknown };
    return { ok: true, geojson: cuerpo.geojson };
  } catch {
    return { ok: false, error: 'Sin conexión con el servidor SIG.' };
  }
}

export async function obtenerMapaWms(capa: string, bbox: string): Promise<{ ok: boolean; urlWms?: string; error?: string }> {
  try {
    const url = new URL(`${URL_API}/sig/igac/mapa`);
    url.searchParams.set('capa', capa);
    url.searchParams.set('bbox', bbox);
    const r = await fetch(url.toString());
    if (!r.ok) return { ok: false, error: `Error ${r.status}` };
    const cuerpo = (await r.json()) as { url_wms?: string };
    return { ok: true, urlWms: cuerpo.url_wms };
  } catch {
    return { ok: false, error: 'Sin conexión con el servidor SIG.' };
  }
}

export interface PuntoNdvi {
  fecha: string;
  ndvi: number;
  nubosidad_pct: number;
  nota: string;
  clase: string;
  manejo: string;
}

export interface InterpretacionNdvi {
  tendencia: string;
  delta: number;
  alerta: string | null;
}

export async function obtenerSerieNdvi(
  predioIdentificador: string,
  bbox: string,
  modo: 'real' | 'demo' = 'demo',
): Promise<{ ok: boolean; puntos?: PuntoNdvi[]; interpretacion?: InterpretacionNdvi; fuente?: string; error?: string }> {
  try {
    const url = new URL(`${URL_API}/analisis/ndvi-serie`);
    url.searchParams.set('predio_identificador', predioIdentificador);
    url.searchParams.set('bbox', bbox);
    url.searchParams.set('modo', modo);
    const r = await fetch(url.toString());
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    return { ok: true, ...((await r.json()) as { puntos: PuntoNdvi[]; interpretacion: InterpretacionNdvi; fuente: string }) };
  } catch {
    return { ok: false, error: 'Sin conexión: se muestra la última serie precargada.' };
  }
}

export interface ResultadoRusle {
  pendiente_pct: number;
  perdida_t_ha_ano: number;
  clase: string;
  manejo: string;
  nivel_riesgo?: string;
  semaforo?: string;
  guardian_erosion?: boolean;
  fuente: string;
  factores: { r: number; k: number; ls: number; l: number; s: number; m: number; c: number; p: number };
}

export async function estimarRusle(params: {
  predio: string;
  pendientePct: number;
  coberturaPct: number;
  longitudM: number;
  r: number;
  k: number;
  practica: string;
}): Promise<{ ok: boolean; resultado?: ResultadoRusle; error?: string }> {
  try {
    const url = new URL(`${URL_API}/analisis/rusle`);
    url.searchParams.set('predio_identificador', params.predio);
    url.searchParams.set('pendiente_pct', String(params.pendientePct));
    url.searchParams.set('cobertura_pct', String(params.coberturaPct));
    url.searchParams.set('longitud_m', String(params.longitudM));
    url.searchParams.set('r', String(params.r));
    url.searchParams.set('k', String(params.k));
    url.searchParams.set('practica', params.practica);
    const r = await fetch(url.toString());
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    return { ok: true, resultado: (await r.json()) as ResultadoRusle };
  } catch {
    return { ok: false, error: 'Sin conexión: anota los datos y calcula en oficina.' };
  }
}

// Extrae la geometría (Polygon) de un GeoJSON FeatureCollection/Feature
// para guardar la copia offline en Dexie capasIgac.
export function extraerGeometria(geojson: unknown): GeoJSON.Geometry | null {
  if (!geojson || typeof geojson !== 'object') return null;
  const g = geojson as { type?: string; geometry?: GeoJSON.Geometry; features?: { geometry?: GeoJSON.Geometry }[] };
  if (g.type === 'FeatureCollection' && g.features?.[0]?.geometry) return g.features[0].geometry;
  if (g.type === 'Feature' && g.geometry) return g.geometry;
  if (g.type && 'coordinates' in g) return g as unknown as GeoJSON.Geometry;
  return null;
}

export interface LluviaIdeam {
  estacion: string;
  municipio: string;
  departamento: string;
  periodo: string;
  anual_mm: number;
  imf: number;
  fuente: string;
  nota: string;
}

export async function pedirLluvia(
  municipio: string,
  modo: 'real' | 'demo' = 'real',
): Promise<{ ok: boolean; lluvia?: LluviaIdeam; error?: string }> {
  try {
    const url = new URL(`${URL_API}/analisis/lluvia-ideam`);
    url.searchParams.set('municipio', municipio);
    url.searchParams.set('modo', modo);
    const r = await fetch(url.toString());
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    return { ok: true, lluvia: (await r.json()) as LluviaIdeam };
  } catch {
    return { ok: false, error: 'Sin conexión: R manual con tu dato local.' };
  }
}

export interface FronteraUpra {
  municipio: string;
  no_condicionada_ha: number;
  condicionada_ha: number;
  total_ha: number;
  pct_en_frontera: number;
  lectura: string;
  aptitud_sipra: string;
  fuente: string;
  nota: string;
}

export async function pedirFrontera(
  municipio: string,
  modo: 'real' | 'demo' = 'real',
): Promise<{ ok: boolean; frontera?: FronteraUpra; error?: string }> {
  try {
    const url = new URL(`${URL_API}/sig/upra-frontera`);
    url.searchParams.set('municipio', municipio);
    url.searchParams.set('modo', modo);
    const r = await fetch(url.toString());
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    return { ok: true, frontera: (await r.json()) as FronteraUpra };
  } catch {
    return { ok: false, error: 'Sin conexión: consulta la frontera en oficina.' };
  }
}

export interface EstimacionDem {  pendiente_pct: number;
  pendiente_max_pct: number;
  desnivel_m: number;
  clase: string;
  manejo: string;
  fuente: string;
}

export async function estimarPendienteDem(
  predioIdentificador: string,
  bbox: string,
  modo: 'real' | 'demo' = 'real',
): Promise<{ ok: boolean; estimacion?: EstimacionDem; error?: string }> {
  try {
    const url = new URL(`${URL_API}/analisis/pendiente-dem`);
    url.searchParams.set('predio_identificador', predioIdentificador);
    url.searchParams.set('bbox', bbox);
    url.searchParams.set('modo', modo);
    const r = await fetch(url.toString());
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    return { ok: true, estimacion: (await r.json()) as EstimacionDem };
  } catch {
    return { ok: false, error: 'Sin conexión: usa la guía local < 7 / 7–25 / > 25 %.' };
  }
}
