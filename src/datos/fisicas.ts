// Datos de propiedades físicas. POLÍTICA DE FUENTES: solo valores publicados
// y verificables (FAO, USDA-NRCS, Ball et al.). Nada aquí inventa umbrales.
export type ClaseTextural =
  | 'arena' | 'arena-franca' | 'franco-arenoso' | 'franco' | 'franco-limoso'
  | 'limo' | 'franco-arcillo-arenoso' | 'franco-arcilloso' | 'franco-arcillo-limoso'
  | 'arcillo-arenoso' | 'arcillo-limoso' | 'arcilla';

export const CLASES_ES: Record<ClaseTextural, string> = {
  'arena': 'Arenoso', 'arena-franca': 'Arena franca', 'franco-arenoso': 'Franco arenoso',
  'franco': 'Franco', 'franco-limoso': 'Franco limoso', 'limo': 'Limoso',
  'franco-arcillo-arenoso': 'Franco arcillo arenoso', 'franco-arcilloso': 'Franco arcilloso',
  'franco-arcillo-limoso': 'Franco arcillo limoso', 'arcillo-arenoso': 'Arcillo arenoso',
  'arcillo-limoso': 'Arcillo limoso', 'arcilla': 'Arcilloso',
};

// Clasificador USDA (Soil Survey Manual): cascada determinista sobre %.
// Retorna null si faltan datos o no suman 100 ± 2.
export function clasificarTextura(arena?: number, limo?: number, arcilla?: number): ClaseTextural | null {
  if (arena === undefined || limo === undefined || arcilla === undefined) return null;
  if ([arena, limo, arcilla].some((v) => Number.isNaN(v) || v < 0)) return null;
  const suma = arena + limo + arcilla;
  if (Math.abs(suma - 100) > 2) return null;
  const a = (arena / suma) * 100, l = (limo / suma) * 100, r = (arcilla / suma) * 100;
  if (l + 1.5 * r < 15) return 'arena';
  if (l + 1.5 * r >= 15 && l + 2 * r < 30) return 'arena-franca';
  if ((r <= 20 && a > 52 && l + 2 * r >= 30) || (r < 7 && l < 50 && l + 2 * r >= 30)) return 'franco-arenoso';
  if (r >= 7 && r < 27 && l >= 28 && l < 50 && a <= 52) return 'franco';
  if (l >= 80 && r < 12) return 'limo';
  if ((l >= 50 && r >= 12 && r < 27) || (l >= 50 && l < 80 && r < 12)) return 'franco-limoso';
  if (r >= 20 && r < 35 && l < 28 && a > 45) return 'franco-arcillo-arenoso';
  if (r >= 27 && r < 40 && a > 20 && a <= 45) return 'franco-arcilloso';
  if (r >= 27 && r < 40 && a <= 20) return 'franco-arcillo-limoso';
  if (r >= 35 && a >= 45) return 'arcillo-arenoso';
  if (r >= 40 && l >= 40) return 'arcillo-limoso';
  if (r >= 40 && a <= 45 && l < 40) return 'arcilla';
  return 'franco';
}

// VESS Sq1–Sq5 (Ball et al. 2007, 2017): coexiste con VSA 0–2 de biológicas.
export interface NivelVess { sq: number; titulo: string; descripcion: string }
export const NIVELES_VESS: NivelVess[] = [
  { sq: 1, titulo: 'Sq1 · Friable', descripcion: 'Agregados porosos y friables; raíces en todo el terrón.' },
  { sq: 2, titulo: 'Sq2 · Buena', descripcion: 'Mayoría de agregados friables, buena porosidad y enraizamiento.' },
  { sq: 3, titulo: 'Sq3 · Moderada', descripcion: 'Mezcla de agregados friables y terrones firmes; porosidad media.' },
  { sq: 4, titulo: 'Sq4 · Compacta', descripcion: 'Terrones firmes dominantes, pocos poros; raíces en grietas.' },
  { sq: 5, titulo: 'Sq5 · Maciza', descripcion: 'Masa densa sin poros visibles; raíces solo superficiales.' },
];
export const FUENTE_VESS = 'Ball et al., Visual Evaluation of Soil Structure (Soil & Tillage Research, 2007; Geoderma, 2017)';

// Munsell: matices con chips sRGB PUBLICADOS (no aproximaciones inventadas).
// Fuente: USGS Open-File Report 2006-1195 (tabla Munsell→sRGB).
// Si la combinación no tiene chip publicado, se muestra el más cercano
// del mismo tono, etiquetado como aproximado. La carta física manda.
export const MUNSELL_TONOS = ['10R', '5R', '10YR', '5YR', '5Y', '10Y'];

interface ChipMunsell { rgb: [number, number, number]; nombre: string }

const CHIPS_USGS: Record<string, ChipMunsell> = {
  '10R-8-2': { rgb: [215, 196, 190], nombre: 'rosa naranja grisáceo' },
  '5R-6-2': { rgb: [163, 143, 141], nombre: 'rojo pálido' },
  '10R-4-6': { rgb: [141, 81, 65], nombre: 'marrón rojizo moderado' },
  '5R-2-2': { rgb: [67, 47, 49], nombre: 'rojo negruzco' },
  '10YR-8-2': { rgb: [214, 198, 175], nombre: 'naranja muy pálido' },
  '5YR-8-4': { rgb: [233, 193, 162], nombre: 'rosa naranja moderado' },
  '10YR-4-2': { rgb: [110, 94, 76], nombre: 'marrón amarillento oscuro' },
  '5YR-2-2': { rgb: [65, 49, 41], nombre: 'marrón oscuro' },
  '5Y-8-4': { rgb: [214, 201, 145], nombre: 'amarillo grisáceo' },
  '10Y-7-4': { rgb: [178, 176, 120], nombre: 'amarillo verdoso moderado' },
  '10Y-4-2': { rgb: [99, 98, 75], nombre: 'oliva grisáceo' },
  '5Y-3-2': { rgb: [80, 73, 55], nombre: 'gris oliva' },
};
export const FUENTE_MUNSELL = 'USGS Open-File Report 2006-1195 (chips sRGB publicados)';

export function munsellChip(
  tono: string, valor?: number, croma?: number
): { css: string; etiqueta: string; exacto: boolean } | null {
  const v = valor ?? 5;
  const c = croma ?? 4;
  const clave = `${tono}-${v}-${c}`;
  const exacto = CHIPS_USGS[clave];
  if (exacto) {
    const [r, g, b] = exacto.rgb;
    return { css: `rgb(${r}, ${g}, ${b})`, etiqueta: `${tono} ${v}/${c} · ${exacto.nombre} (chip publicado)`, exacto: true };
  }
  let mejor: { clave: string; chip: ChipMunsell; dist: number } | null = null;
  for (const [k, chip] of Object.entries(CHIPS_USGS)) {
    if (!k.startsWith(`${tono}-`)) continue;
    const [, vv, cc] = k.split('-').map(Number);
    const dist = Math.abs(vv - v) + Math.abs(cc - c);
    if (!mejor || dist < mejor.dist) mejor = { clave: k, chip, dist };
  }
  if (!mejor) return null;
  const [r, g, b] = mejor.chip.rgb;
  return {
    css: `rgb(${r}, ${g}, ${b})`,
    etiqueta: `${tono} ${v}/${c} ≈ chip ${mejor.clave.replace(/-/g, ' ')} ${mejor.chip.nombre} (aproximado)`,
    exacto: false,
  };
}
export const ADVERTENCIA_MUNSELL =
  'Preview digital con chips publicados (USGS): varía según pantalla. La determinación válida exige la carta física Munsell (USDA-NRCS).';

// Densidad: USDA-NRCS Soil Quality Indicators – Bulk Density
// (Arshad, Lowery & Grossman 1996). Ideal vs. restringe raíces, por clase.
export interface UmbralDensidad { idealMax: number; restringeMin: number }
export const DENSIDAD_NRCS: Record<ClaseTextural, UmbralDensidad> = {
  'arena': { idealMax: 1.6, restringeMin: 1.8 },
  'arena-franca': { idealMax: 1.6, restringeMin: 1.8 },
  'franco-arenoso': { idealMax: 1.4, restringeMin: 1.8 },
  'franco': { idealMax: 1.4, restringeMin: 1.8 },
  'franco-limoso': { idealMax: 1.4, restringeMin: 1.75 },
  'limo': { idealMax: 1.4, restringeMin: 1.75 },
  'franco-arcillo-arenoso': { idealMax: 1.4, restringeMin: 1.75 },
  'franco-arcilloso': { idealMax: 1.4, restringeMin: 1.75 },
  'franco-arcillo-limoso': { idealMax: 1.4, restringeMin: 1.65 },
  'arcillo-arenoso': { idealMax: 1.1, restringeMin: 1.58 },
  'arcillo-limoso': { idealMax: 1.1, restringeMin: 1.58 },
  'arcilla': { idealMax: 1.1, restringeMin: 1.47 },
};
export const FUENTE_DENSIDAD =
  'USDA-NRCS, Soil Quality Indicators – Bulk Density (Arshad, Lowery & Grossman 1996)';

export function calcularDA(pesoSecoG: number, volumenCm3: number): number | null {
  if (!(volumenCm3 > 0) || !(pesoSecoG >= 0)) return null;
  return Math.round((pesoSecoG / volumenCm3) * 100) / 100;
}

// Porosidad derivada con densidad real DR = 2,65 g/cm³ (supuesto documentado,
// Oklahoma State Ext. PSS-2287; válido salvo suelos volcánicos o muy orgánicos).
export const DENSIDAD_REAL_SUPUESTA = 2.65;
export function calcularPorosidad(da: number, dr = DENSIDAD_REAL_SUPUESTA): number | null {
  if (!(da > 0)) return null;
  return Math.round((1 - da / dr) * 1000) / 10;
}

export type EstadoDensidad = 'optimo' | 'vigilar' | 'restringe';
export function interpretarDensidad(da: number, clase: ClaseTextural): EstadoDensidad {
  const u = DENSIDAD_NRCS[clase];
  if (da < u.idealMax) return 'optimo';
  if (da > u.restringeMin) return 'restringe';
  return 'vigilar';
}

// Porosidad: SENA La Granja (Jordán 2005). Nutre el semáforo de porosidad.
export function interpretarPorosidad(pct: number): string {
  if (pct < 30) return 'Muy baja';
  if (pct < 40) return 'Baja';
  if (pct <= 50) return 'Media';
  if (pct <= 60) return 'Alta';
  return 'Muy alta';
}
export const FUENTE_POROSIDAD =
  'SENA La Granja, Manual de Prácticas de Campo y Laboratorio de Suelos (2013), según Jordán (2005)';

// Minerales → Munsell → color (SENA La Granja, modificado de NRCS-USDA 2002).
export interface MineralMunsell { mineral: string; munsell: string; color: string }
export const MINERALES_MUNSELL: MineralMunsell[] = [
  { mineral: 'Goetita (FeOOH)', munsell: '10YR 8/6 · 7.5YR 5/6', color: 'Amarillo / marrón fuerte' },
  { mineral: 'Hematita (Fe₂O₃)', munsell: '5R 3/6 · 10R 4/8', color: 'Rojo' },
  { mineral: 'Lepidocrocita', munsell: '5YR 6/8 · 2.5YR 4/6', color: 'Amarillo rojizo / rojo' },
  { mineral: 'Ferrihidrita', munsell: '2.5YR 3/6', color: 'Rojo oscuro' },
  { mineral: 'Humus', munsell: '10YR 2/1', color: 'Negro (fertilidad, MO)' },
  { mineral: 'Calcita / dolomita', munsell: '10YR 8/2', color: 'Blanco' },
  { mineral: 'Yeso', munsell: '10YR 8/3', color: 'Marrón muy pálido' },
  { mineral: 'Cuarzo', munsell: '10YR 6/1', color: 'Gris claro' },
  { mineral: 'Sulfuro de hierro (FeS)', munsell: '10YR 2/1', color: 'Negro (anaerobio)' },
  { mineral: 'Jarosita', munsell: '5Y 6/4', color: 'Amarillo pálido' },
];
export const FUENTE_MINERALES = 'SENA La Granja (2013), modificado de NRCS-USDA (2002)';

// Agua disponible = CC − PMP (cálculo directo, no se almacena: se muestra).
// CC: agua retenida a −10/−33 kPa; PMP: −1500 kPa; lo retenido cerca de −10 kPa
// es fácilmente disponible; poros de 0,2–50 µm la almacenan. Tabla 1.14
// (Rawls et al. 1992) trae CC/PMP por clase textural.
export const FUENTE_AGUA =
  'propiedades_fisicas_de_los_suelos.pdf, cap. 1 (§1.3.8, Tabla 1.14 Rawls et al. 1992)';

export function calcularAguaDisponible(cc?: number, pmp?: number): number | null {
  if (cc === undefined || pmp === undefined) return null;
  const disponible = Math.round((cc - pmp) * 10) / 10;
  return disponible >= 0 ? disponible : null;
}
