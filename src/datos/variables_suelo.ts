// Catálogo de variables de suelo por categoría.
// Nivel 1 Categoría (físicas/químicas/biológicas) → Nivel 2 Variable → Nivel 3 Interpretación.
// La interpretación nunca se bloquea: sin datos explica límites y qué medir para confirmar.
// Fuentes trazables en src/ según AGENTS.md §2.5.
import type { FichaSueloFormulario } from '../esquemas/suelo';
import { clasificarTextura } from './fisicas';

export type CategoriaSuelo = 'fisicas' | 'quimicas' | 'biologicas';
export type EstadoVariable = 'pendiente' | 'en_progreso' | 'registrada';

export interface VariableSuelo {
  id: string;
  categoria: CategoriaSuelo;
  titulo: string;
  descripcion: string;
  /** Campos del formulario que alimentan la variable. */
  campos: (keyof FichaSueloFormulario)[];
  /** Nº mínimo de campos con dato para darla por registrada. */
  minimoParaRegistrar: number;
  /** Evaluación específica (ej. suma granulometría). Si retorna false, no es registrada aunque haya nº. */
  valida?: (v: Partial<FichaSueloFormulario>) => boolean;
  sinDatosQueDecir: string;
  paraConfirmar: string;
}

type V = Partial<FichaSueloFormulario>;

function conDato(v: V, c: keyof FichaSueloFormulario): boolean {
  const x = v[c];
  if (x === undefined || x === null || x === '') return false;
  if (typeof x === 'number' && Number.isNaN(x)) return false;
  return true;
}

export function estadoVariable(def: VariableSuelo, valores: V): { estado: EstadoVariable; avance: number; conDato: number } {
  const n = def.campos.filter((c) => conDato(valores, c)).length;
  const avance = def.campos.length === 0 ? 0 : Math.round((n / def.campos.length) * 100);
  if (n === 0) return { estado: 'pendiente', avance, conDato: n };
  const valida = def.valida ? def.valida(valores) : true;
  if (n >= def.minimoParaRegistrar && valida) return { estado: 'registrada', avance, conDato: n };
  return { estado: 'en_progreso', avance, conDato: n };
}

const granulometriaValida = (v: V): boolean => {
  // Registrada por tacto aunque no haya laboratorio, o por laboratorio válido.
  if (typeof v.texturaTacto === 'string' && v.texturaTacto.length > 0) return true;
  return clasificarTextura(v.arenaPct, v.limoPct, v.arcillaPct) !== null;
};

const munsellValido = (v: V): boolean =>
  typeof v.munsellH === 'string' && v.munsellH.length > 0 && typeof v.munsellV === 'number' && typeof v.munsellC === 'number';

const aguaValida = (v: V): boolean =>
  typeof v.capacidadCampoPct === 'number' && typeof v.pmpPct === 'number' && (v.pmpPct as number) <= (v.capacidadCampoPct as number);

export const VARIABLES_FISICAS: VariableSuelo[] = [
  {
    id: 'textura', categoria: 'fisicas', titulo: 'Textura',
    descripcion: 'Arena, limo y arcilla: retención de agua y manejo.',
    campos: ['texturaTacto', 'arenaPct', 'limoPct', 'arcillaPct'],
    minimoParaRegistrar: 1, valida: granulometriaValida,
    sinDatosQueDecir: 'Sin textura no se estima retención de agua ni dosis de cal por textura.',
    paraConfirmar: 'Tacto (cinta/bola) + granulometría de laboratorio que sume 100 ± 2 %.',
  },
  {
    id: 'color', categoria: 'fisicas', titulo: 'Color Munsell',
    descripcion: 'Materia orgánica, óxidos de hierro y drenaje.',
    campos: ['munsellH', 'munsellV', 'munsellC', 'colorEstado'],
    minimoParaRegistrar: 3, valida: munsellValido,
    sinDatosQueDecir: 'Sin color no se infiere materia orgánica ni drenaje.',
    paraConfirmar: 'Tono + valor + croma con carta física Munsell en seco y en húmedo, más foto.',
  },
  {
    id: 'densidad', categoria: 'fisicas', titulo: 'Densidad y porosidad',
    descripcion: 'Compactación y espacio para raíces, agua y aire.',
    campos: ['densidadAparente', 'densidadReal', 'porosidadPct'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin densidad no se califica compactación; usa VESS e infiltración como proxy.',
    paraConfirmar: 'Densidad aparente por cilindro (105 °C 24 h) + textura para el semáforo.',
  },
  {
    id: 'agua', categoria: 'fisicas', titulo: 'Agua disponible',
    descripcion: 'Capacidad de campo menos punto de marchitez.',
    campos: ['capacidadCampoPct', 'pmpPct'],
    minimoParaRegistrar: 2, valida: aguaValida,
    sinDatosQueDecir: 'Sin CC y PMP no se programa riego; usa textura + estructura como proxy.',
    paraConfirmar: 'CC y PMP del reporte de laboratorio (PMP ≤ CC).',
  },
  {
    id: 'estructura', categoria: 'fisicas', titulo: 'Estructura y manejo',
    descripcion: 'VESS, compactación, infiltración y profundidad efectiva.',
    campos: ['estructuraVess', 'compactacion', 'infiltracion', 'profundidadEfectivaCm', 'estructuraDesc'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin VESS no se califica estructura; describe terrones y raíces a mano.',
    paraConfirmar: 'Bloque de 20 cm puntuado por capa (Sq1–Sq5) + foto VESS.',
  },
];

export const VARIABLES_QUIMICAS: VariableSuelo[] = [
  {
    id: 'acidez', categoria: 'quimicas', titulo: 'Acidez',
    descripcion: 'pH: disponibilidad de nutrientes para la planta.',
    campos: ['phAgua', 'phKcl', 'phCampo'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin pH no se evalúa acidez ni necesidad de enmienda.',
    paraConfirmar: 'pH en agua y KCl del reporte + pH de campo.',
  },
  {
    id: 'salinidad', categoria: 'quimicas', titulo: 'Salinidad',
    descripcion: 'Sales solubles: frenan agua y nutrientes si se acumulan.',
    campos: ['conductividadDsM', 'ceCampo'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin CE no se descarta acumulación de sales.',
    paraConfirmar: 'CE de laboratorio (dS/m) + CE portátil.',
  },
  {
    id: 'materia', categoria: 'quimicas', titulo: 'MO y N',
    descripcion: 'Materia orgánica y nitrógeno: reserva de fertilidad y vida.',
    campos: ['materiaOrganicaPct', 'nitrogenoPct'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin MO ni N no se estima la fertilidad del suelo.',
    paraConfirmar: 'MO (Walkley-Black) y N total del reporte.',
  },
  {
    id: 'bases', categoria: 'quimicas', titulo: 'Bases y CIC',
    descripcion: 'Cationes retenidos, acidez y capacidad de intercambio.',
    campos: ['calcioCmolKg', 'magnesioCmolKg', 'potasioCmolKg', 'sodioCmolKg', 'cicCmolKg', 'aluminioCmolKg', 'saturacionAlPct'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin bases ni CIC no se calculan saturaciones ni dosis de cal.',
    paraConfirmar: 'Ca, Mg, K, Na, CIC y Al del reporte.',
  },
  {
    id: 'fosforo', categoria: 'quimicas', titulo: 'P y micros',
    descripcion: 'Fósforo disponible, azufre y elementos traza.',
    campos: ['fosforoMgKg', 'metodoFosforo', 'azufreMgKg', 'hierroMgKg', 'manganesoMgKg', 'zincMgKg', 'cobreMgKg', 'boroMgKg', 'sintomasVisuales', 'carbonatos'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin P no se evalúa la fertilidad fosfórica.',
    paraConfirmar: 'P disponible con su método (Bray II/Olsen) + micros.',
  },
];

export const VARIABLES_BIOLOGICAS: VariableSuelo[] = [
  {
    id: 'vida', categoria: 'biologicas', titulo: 'Vida',
    descripcion: 'Macrofauna y signos vitales del suelo.',
    campos: ['lombricesConteo', 'nodulacion', 'olorSuelo', 'descomposicionMo'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin conteo no se valora la actividad biológica.',
    paraConfirmar: 'Lombrices en cubo de 20×20×20 + nodulación, olor y descomposición.',
  },
  {
    id: 'vsa', categoria: 'biologicas', titulo: 'VSA',
    descripcion: 'Puntuación visual 0 pobre · 1 moderado · 2 bueno.',
    campos: [],
    minimoParaRegistrar: 6,
    sinDatosQueDecir: 'Sin puntuar no hay índice visual de calidad.',
    paraConfirmar: 'Los 6 indicadores comparados con la guía fotográfica.',
  },
  {
    id: 'cobertura', categoria: 'biologicas', titulo: 'Cobertura',
    descripcion: 'Foto cenital del dosel: % verde calculado offline.',
    campos: ['coberturaVegetalPct'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin foto no hay % verde calculado.',
    paraConfirmar: 'Foto cenital a ≥ 60 cm + % registrado en la ficha.',
  },
  {
    id: 'laboratorio', categoria: 'biologicas', titulo: 'Laboratorio',
    descripcion: 'Respiración, biomasa microbiana y micorrizas.',
    campos: ['respiracionSuelo', 'carbonoBiomasa', 'micorrizas'],
    minimoParaRegistrar: 1,
    sinDatosQueDecir: 'Sin reporte no hay biología de laboratorio.',
    paraConfirmar: 'Respiración basal, C-biomasa y micorrizas del reporte.',
  },
];

export const VARIABLES_POR_CATEGORIA: Record<CategoriaSuelo, VariableSuelo[]> = {
  fisicas: VARIABLES_FISICAS,
  quimicas: VARIABLES_QUIMICAS,
  biologicas: VARIABLES_BIOLOGICAS,
};

export const TEXTO_ESTADO: Record<EstadoVariable, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  registrada: 'Registrada',
};

// Ámbito local de la herramienta Suelos: cajón único donde se guardan las
// fichas hasta que la capa de planificación (con sesión) las vincule a predios.
export const AMBITO_SUELOS = 'suelos';

// Conteos externos (no viven en el formulario, ej. puntajes VSA 0·1·2).
export interface ConteoExtra { hechos: number; total: number }

export function resumenVariables(
  categoria: CategoriaSuelo,
  valores: Partial<FichaSueloFormulario>,
  conteosExtra?: Record<string, ConteoExtra>,
): { registradas: number; total: number } {
  const vars = VARIABLES_POR_CATEGORIA[categoria] ?? [];
  const registradas = vars.filter((v) => {
    const extra = conteosExtra?.[v.id];
    if (extra) return extra.hechos >= v.minimoParaRegistrar;
    return estadoVariable(v, valores).estado === 'registrada';
  }).length;
  return { registradas, total: vars.length };
}
