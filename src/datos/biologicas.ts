import type { FichaSueloFormulario } from '../esquemas/suelo';
import type { EstadoVariable } from './variables_suelo';

type V = Partial<FichaSueloFormulario>;

export type IconoBiologicoId = 'vida' | 'vsa' | 'cobertura' | 'laboratorio' | 'cierre';

export interface MetaVariableBiologica {
  id: string;
  titulo: string;
  icono: IconoBiologicoId;
  color: string;
  imagen: string;
  imagenAlt: string;
  proposito: string;
}

// Recursos visuales de la sección. Las imágenes son las públicas del proyecto
// y los colores salen de variables CSS con adaptación a modo oscuro.
export const PASOS_BIOLOGICOS: MetaVariableBiologica[] = [
  {
    id: 'vida', titulo: 'Vida', icono: 'vida', color: 'var(--bio-vida)',
    imagen: '/imagenes/1.jpg', imagenAlt: 'Plántulas emergiendo del suelo',
    proposito: 'Registra macrofauna y signos de actividad. El conteo se compara con los tramos documentados de la guía VSA.',
  },
  {
    id: 'vsa', titulo: 'VSA', icono: 'vsa', color: 'var(--bio-vsa)',
    imagen: '/imagenes/3.jpg', imagenAlt: 'Agregados y poros del suelo en primer plano',
    proposito: 'Puntúa los seis indicadores de 0 a 2 y observa la suma simple en vivo, sin reclasificarla.',
  },
  {
    id: 'cobertura', titulo: 'Cobertura', icono: 'cobertura', color: 'var(--bio-cobertura)',
    imagen: '/imagenes/4.jpg', imagenAlt: 'Dosel de un cultivo hortícola como cobertura vegetal',
    proposito: 'Toma la foto cenital o registra el porcentaje; el valor queda como serie temporal sin umbral validado.',
  },
  {
    id: 'laboratorio', titulo: 'Laboratorio', icono: 'laboratorio', color: 'var(--bio-laboratorio)',
    imagen: '/imagenes/2.jpg', imagenAlt: 'Perfil de suelo con raíces',
    proposito: 'Transcribe respiración, biomasa microbiana y micorrizas del reporte; se guardan como registro.',
  },
  {
    id: 'conclusiones', titulo: 'Conclusiones', icono: 'cierre', color: 'var(--bio-cierre)',
    imagen: '/imagenes/5.jpg', imagenAlt: 'Vista satelital del territorio para leer el contexto del predio',
    proposito: 'Revisa la cobertura, las incoherencias y lo que falta antes de guardar la ficha.',
  },
];

export const META_BIOLOGICA: Record<string, MetaVariableBiologica> = Object.fromEntries(
  PASOS_BIOLOGICOS.map((p) => [p.id, p]),
);

export interface FotoCoberturaVista {
  url: string;
  pct: number;
  mascara?: string;
}

export const FUENTES_BIOLOGICAS = {
  vida: 'Shepherd, VSA Field Guides (FAO, 2008); AgResearch, Soil Health for pastoral systems (2025); Väderstad, Guide to Visual Soil Assessments',
  vsa: 'Shepherd, VSA Field Guides (FAO, 2008); AgResearch, Soil Health for pastoral systems (2025); Väderstad, Guide to Visual Soil Assessments',
  cobertura: 'Patrignani & Ochsner (2015), Agronomy Journal; Shepherd, VSA Field Guides (FAO, 2008)',
  laboratorio: 'manual_de_agroecologia_y_agroforesteria._practicas_para_una_agricultura_ecologica.pdf; guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf',
} as const;

export const INDICADORES_VSA = [
  'estructura', 'porosidad', 'color', 'lombrices', 'cobertura', 'erosion_visible',
] as const;

export type IndicadorVsa = (typeof INDICADORES_VSA)[number];

export const ETIQUETA_VSA: Record<IndicadorVsa, string> = {
  estructura: 'Estructura',
  porosidad: 'Porosidad',
  color: 'Color',
  lombrices: 'Lombrices',
  cobertura: 'Cobertura',
  erosion_visible: 'Erosión visible',
};

export const AYUDA_VSA: Record<IndicadorVsa, string> = {
  estructura: 'Agregados, terrones y estabilidad al desmoronar.',
  porosidad: 'Macroporos visibles y aireación del bloque.',
  color: 'Color del suelo y evidencias de moteados redox.',
  lombrices: 'Conteo en el mismo cubo de 20×20×20 cm.',
  cobertura: 'Residuos y plantas que protegen la superficie.',
  erosion_visible: 'Surcos, pedestales, sedimentos o pérdida de capa.',
};

export const OPCIONES_PUNTAJE_VSA = [
  { valor: 0, etiqueta: '0 · Pobre' },
  { valor: 1, etiqueta: '1 · Moderado' },
  { valor: 2, etiqueta: '2 · Bueno' },
] as const;

export const VSA_MAXIMO = INDICADORES_VSA.length * 2;

export interface ResumenVsa {
  tocados: number;
  total: number;
  suma: number;
  completo: boolean;
}

export function puntajesVsa(puntajes: Record<string, number>): ResumenVsa {
  const valores = INDICADORES_VSA
    .map((id) => puntajes[id])
    .filter((v): v is number => v === 0 || v === 1 || v === 2);
  const suma = valores.reduce((a, b) => a + b, 0);
  return {
    tocados: valores.length,
    total: INDICADORES_VSA.length,
    suma,
    completo: valores.length === INDICADORES_VSA.length,
  };
}

export function estadoVsa(resumen: ResumenVsa): EstadoVariable {
  if (resumen.tocados === 0) return 'pendiente';
  return resumen.completo ? 'registrada' : 'en_progreso';
}

export function avanceVsa(resumen: ResumenVsa): number {
  return resumen.total === 0 ? 0 : Math.round((resumen.tocados / resumen.total) * 100);
}

export function textoVsa(resumen: ResumenVsa): string {
  if (resumen.tocados === 0) {
    return 'Puntúa cada indicador de 0 a 2. La ficha muestra la suma simple de los seis indicadores.';
  }
  if (!resumen.completo) {
    return `${resumen.tocados} de ${resumen.total} indicadores puntuados. Suma parcial: ${resumen.suma}.`;
  }
  return `Suma simple ${resumen.suma} de ${VSA_MAXIMO}. La guía VSA también describe una suma ponderada; esta ficha no la recalcula.`;
}

export const REFERENCIA_LOMBRICES = {
  pobreMax: 15,
  moderadoMin: 22,
  moderadoMax: 28,
  buenoMin: 35,
} as const;

export function textoLombrices(conteo: number | undefined): string {
  if (conteo === undefined) return 'Registra el conteo del cubo de 20×20×20 cm.';
  if (conteo < REFERENCIA_LOMBRICES.pobreMax) {
    return 'Menos de 15 lombrices: condición pobre según la referencia de la guía VSA.';
  }
  if (conteo >= REFERENCIA_LOMBRICES.moderadoMin && conteo <= REFERENCIA_LOMBRICES.moderadoMax) {
    return 'Entre 22 y 28 lombrices: rango moderado de la referencia de la guía VSA.';
  }
  if (conteo > REFERENCIA_LOMBRICES.buenoMin) {
    return 'Más de 35 lombrices: condición buena según la referencia de la guía VSA.';
  }
  return 'El conteo cae en un intervalo que la guía no clasifica (15–21 o 29–35). Se registra sin categoría.';
}

export const OPCIONES_NODULACION = [
  { valor: 'sin nódulos', etiqueta: 'Sin nódulos', detalle: 'No se observan nódulos en las raíces revisadas.' },
  { valor: 'nódulos blancos (inactivos)', etiqueta: 'Blancos', detalle: 'Nódulos presentes pero inactivos.' },
  { valor: 'nódulos rosados (activos)', etiqueta: 'Rosados', detalle: 'Nódulos rosados: fijación activa.' },
] as const;

export const OPCIONES_OLOR = [
  { valor: 'tierra fresca', etiqueta: 'Tierra fresca', detalle: 'Olor aeróbico, sin putrefacción.' },
  { valor: 'neutro', etiqueta: 'Neutro', detalle: 'Sin olor marcado.' },
  { valor: 'putrefacción / azufre', etiqueta: 'Putrefacción', detalle: 'Olor a anaerobiosis o azufre.' },
] as const;

export const OPCIONES_DESCOMPOSICION = [
  { valor: 'residuos frescos', etiqueta: 'Frescos', detalle: 'Residuos recientes, poca transformación.' },
  { valor: 'parcialmente descompuestos', etiqueta: 'Parciales', detalle: 'Residuos en transformación.' },
  { valor: 'humus estable', etiqueta: 'Humus', detalle: 'Materia orgánica transformada y estable.' },
] as const;

export function etiquetaOpcion(
  opciones: readonly { valor: string; etiqueta: string }[], valor: string | undefined,
): string | undefined {
  return opciones.find((o) => o.valor === valor)?.etiqueta;
}

export function textoNodulacion(valor: string | undefined): string {
  if (valor === undefined) return 'Sin registro. Revisa raíces de leguminosas si están presentes.';
  if (valor === 'sin nódulos') return 'Sin nódulos: no se observa fijación en las raíces revisadas.';
  if (valor === 'nódulos blancos (inactivos)') return 'Nódulos blancos: presentes pero inactivos.';
  if (valor === 'nódulos rosados (activos)') return 'Nódulos rosados: fijación activa en las raíces revisadas.';
  return 'Registro cualitativo de nodulación.';
}

export function textoOlor(valor: string | undefined): string {
  if (valor === undefined) return 'Sin registro. El olor se evalúa al abrir el bloque.';
  if (valor === 'tierra fresca') return 'Tierra fresca: actividad aeróbica sin signos de putrefacción.';
  if (valor === 'neutro') return 'Neutro: sin olor marcado; no confirma ni descarta anaerobiosis.';
  if (valor === 'putrefacción / azufre') return 'Putrefacción o azufre: señal de anaerobiosis; revisa drenaje y compactación.';
  return 'Registro cualitativo del olor.';
}

export function textoDescomposicion(valor: string | undefined): string {
  if (valor === undefined) return 'Sin registro. Observa los residuos y su grado de transformación.';
  if (valor === 'residuos frescos') return 'Residuos frescos: poca transformación de la materia orgánica.';
  if (valor === 'parcialmente descompuestos') return 'Residuos parcialmente descompuestos: la materia orgánica está en transformación.';
  if (valor === 'humus estable') return 'Humus estable: materia orgánica transformada y estable.';
  return 'Registro cualitativo de la descomposición.';
}

export function textoCobertura(pct: number | undefined): string {
  if (pct === undefined) return 'Sin porcentaje registrado. Usa la foto cenital o transcribe el dato.';
  return `${pct} % de cobertura registrada. No hay umbral validado en el catálogo: se conserva como serie temporal.`;
}

export function textoRespiracion(valor: number | undefined): string {
  if (valor === undefined) return 'Sin respiración basal registrada.';
  return 'Registro de laboratorio. Sin umbral validado en el catálogo; compara contra tu propia serie temporal.';
}

export function textoCarbonoBiomasa(valor: number | undefined): string {
  if (valor === undefined) return 'Sin carbono de biomasa registrado.';
  return 'Registro de laboratorio. Sin umbral validado en el catálogo; compara contra tu propia serie temporal.';
}

export function textoMicorrizas(valor: string | undefined): string {
  if (valor === undefined || valor.trim() === '') return 'Sin registro de colonización micorrízica.';
  return 'Registro cualitativo del reporte. No se clasifica porque el catálogo no fija un umbral.';
}

export function aNumero(valor: unknown): number | undefined {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : undefined;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const n = Number(valor);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function valorVida(valores: V): string {
  const partes: string[] = [];
  const lombrices = aNumero(valores.lombricesConteo);
  if (lombrices !== undefined) partes.push(`${lombrices} lombrices`);
  const nodulacion = etiquetaOpcion(OPCIONES_NODULACION, valores.nodulacion);
  if (nodulacion !== undefined) partes.push(`nodulación ${nodulacion.toLowerCase()}`);
  const olor = etiquetaOpcion(OPCIONES_OLOR, valores.olorSuelo);
  if (olor !== undefined) partes.push(`olor ${olor.toLowerCase()}`);
  const descomposicion = etiquetaOpcion(OPCIONES_DESCOMPOSICION, valores.descomposicionMo);
  if (descomposicion !== undefined) partes.push(`descomposición ${descomposicion.toLowerCase()}`);
  return partes.length > 0 ? partes.join(' · ') : 'Sin registro de campo';
}

export function valorLaboratorio(valores: V): string {
  const partes: string[] = [];
  const respiracion = aNumero(valores.respiracionSuelo);
  const biomasa = aNumero(valores.carbonoBiomasa);
  if (respiracion !== undefined) partes.push(`respiración ${respiracion}`);
  if (biomasa !== undefined) partes.push(`C-biomasa ${biomasa}`);
  if (valores.micorrizas !== undefined && valores.micorrizas.trim() !== '') partes.push('micorrizas');
  return partes.length > 0 ? partes.join(' · ') : 'Sin reporte de laboratorio';
}

export const SLIDE_DE_VARIABLE_BIOLOGICA: Record<string, number> = {
  vida: 0, vsa: 1, cobertura: 2, laboratorio: 3,
};
