import { baseDatos, type EscenarioLocal, type EspecieLocal } from '../base_datos/local';
import { ESPECIES_BASE } from '../datos/especies_base';

const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

export interface Motivo {
  regla: string;
  cumple: boolean;
  cita: string;
}

export interface Compatibilidad {
  especie: string;
  puntaje: number;
  apta: boolean;
  motivos: Motivo[];
}

export interface Escenario {
  tipo: 'A' | 'B' | 'C';
  nombre: string;
  usos: Record<string, number>;
  componentes: string[];
  practica: string;
  cobertura_meta: number;
  rotacion: string;
  especies_aptas: number;
  rusle_antes_t_ha_ano: number;
  rusle_despues_t_ha_ano: number;
  proyeccion_cobertura: { ano: number; cobertura_pct: number }[];
  conservacion_pct: number;
  fuente: string;
}

export interface Sitio {
  ph?: number;
  mo_pct?: number;
  textura?: string;
  pendiente_pct?: number;
  zona_vida?: string;
  cobertura_pct: number;
}

// Siembra el banco base una sola vez (origen 'base', sin duplicar).
export async function sembrarBanco(): Promise<string> {
  const existentes = await baseDatos.especies.where('origen').equals('base').count();
  if (existentes > 0) return `Banco base ya sembrado (${existentes} especies).`;
  for (const e of ESPECIES_BASE) {
    await baseDatos.especies.add({ ...e, sincronizada: false });
  }
  return `${ESPECIES_BASE.length} especies base sembradas offline.`;
}

function especieABackend(e: EspecieLocal) {
  return {
    nombre_comun: e.nombreComun,
    rol: e.rol,
    ph_min: e.phMin,
    ph_max: e.phMax,
    mo_min_pct: e.moMinPct,
    texturas: e.texturas,
    pendiente_max_pct: e.pendienteMaxPct,
    zona_vida: e.zonaVida,
  };
}

export async function pedirCompatibilidades(
  especies: EspecieLocal[],
  sitio: Sitio,
): Promise<{ ok: boolean; resultados?: Compatibilidad[]; error?: string }> {
  try {
    const resultados: Compatibilidad[] = [];
    for (const e of especies) {
      const r = await fetch(`${URL_API}/simulador/compatibilidad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ especie: especieABackend(e), sitio }),
      });
      if (!r.ok) return { ok: false, error: `Error ${r.status} en compatibilidad` };
      resultados.push((await r.json()) as Compatibilidad);
    }
    return { ok: true, resultados };
  } catch {
    return { ok: false, error: 'Sin conexión: el simulador compara con red en oficina.' };
  }
}

export async function pedirEscenarios(
  sitio: Sitio,
  especies: EspecieLocal[],
): Promise<{ ok: boolean; escenarios?: Escenario[]; error?: string }> {
  try {
    const r = await fetch(`${URL_API}/simulador/escenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sitio, especies: especies.map(especieABackend) }),
    });
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    const cuerpo = (await r.json()) as { escenarios: Escenario[] };
    return { ok: true, escenarios: cuerpo.escenarios };
  } catch {
    return { ok: false, error: 'Sin conexión: genera escenarios con wifi en oficina.' };
  }
}

export async function guardarEscenario(
  predioIdentificador: string,
  loteNombre: string | undefined,
  escenario: Escenario,
): Promise<string> {
  const usos = Object.entries(escenario.usos).map(([uso, porcentaje]) => ({ uso, porcentaje }));
  await baseDatos.escenarios.add({
    predioIdentificador,
    loteNombre,
    nombre: escenario.nombre,
    tipo: escenario.tipo,
    usosSuelo: usos,
    componentes: escenario.componentes.map((especie) => ({ rol: 'Componente', especie })),
    rotacion: escenario.rotacion,
    coberturaAno5: escenario.proyeccion_cobertura[escenario.proyeccion_cobertura.length - 1]?.cobertura_pct,
    rusleAntes: escenario.rusle_antes_t_ha_ano,
    rusleDespues: escenario.rusle_despues_t_ha_ano,
    referenciaBibliografica: escenario.fuente,
    fecha: new Date().toISOString().slice(0, 10),
    sincronizada: false,
  });
  const total = await baseDatos.escenarios.where('predioIdentificador').equals(predioIdentificador).count();
  return `Escenario ${escenario.tipo} guardado offline (${total} en este predio).`;
}

export interface Costo {
  tipo: string;
  area_ha: number;
  anos: number;
  establecimiento_cop: number;
  mantenimiento_cop: number;
  total_cop: number;
  costo_ha_cop: number;
  supuestos: string[];
}

export async function pedirCostos(
  tipos: ('A' | 'B' | 'C')[],
  areaHa: number,
): Promise<Record<string, Costo>> {
  const salida: Record<string, Costo> = {};
  try {
    for (const t of tipos) {
      const url = new URL(`${URL_API}/simulador/costos`);
      url.searchParams.set('tipo', t);
      url.searchParams.set('area_ha', String(areaHa));
      const r = await fetch(url.toString(), { method: 'POST' });
      if (!r.ok) return {};
      salida[t] = (await r.json()) as Costo;
    }
  } catch {
    return {};
  }
  return salida;
}

export interface Rotacion {
  id: string;
  nombre: string;
  secuencia: string[];
  aporte: string;
  fuente: string;
}

export async function pedirRotaciones(): Promise<Rotacion[]> {
  try {
    const r = await fetch(`${URL_API}/simulador/rotaciones`);
    if (!r.ok) return [];
    return ((await r.json()) as { rotaciones: Rotacion[] }).rotaciones;
  } catch {
    return [];
  }
}

export interface Riego {
  cultivo: string;
  kc: number;
  eto_mm: number;
  et_cultivo_mm: number;
  lluvia_efectiva_mm: number;
  lamina_riego_mm: number;
  manejo: string;
  fuente: string;
}

export const CULTIVOS_RIEGO = ['cacao', 'maiz', 'frijol', 'platano', 'yuca', 'pasto', 'bosque', 'hortalizas'];

export async function pedirRiego(params: {
  cultivo: string;
  lluviaMm: number;
  tmax?: number;
  tmin?: number;
}): Promise<{ ok: boolean; riego?: Riego; error?: string }> {
  try {
    const url = new URL(`${URL_API}/simulador/riego`);
    url.searchParams.set('cultivo', params.cultivo);
    url.searchParams.set('lluvia_mm', String(params.lluviaMm));
    if (params.tmax !== undefined) url.searchParams.set('tmax', String(params.tmax));
    if (params.tmin !== undefined) url.searchParams.set('tmin', String(params.tmin));
    const r = await fetch(url.toString(), { method: 'POST' });
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    return { ok: true, riego: (await r.json()) as Riego };
  } catch {
    return { ok: false, error: 'Sin conexión: el riego se calcula en oficina.' };
  }
}

export type { EscenarioLocal };
