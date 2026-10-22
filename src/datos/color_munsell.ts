// Estimación del color del suelo con la metodología Munsell. POLÍTICA DE FUENTES
// (§2.5): la secuencia de campo, la notación y las interpretaciones provienen de
// literatura publicada; no se inventan umbrales.
//
// Secuencia: carta Munsell Soil-Color (Munsell Color 2009), USDA-NRCS Soil Survey
// Manual (cap. 3) y Field Book (Schoeneberger et al. 2012); FAO (2006).
import { MUNSELL_TONOS } from './fisicas';

export const FUENTES_COLOR = [
  'Munsell Color (2009). Munsell Soil-Color Charts',
  'USDA-NRCS. Soil Survey Manual, cap. 3 (Examination and Description of Soils)',
  'Schoeneberger et al. (2012). Field Book for Describing and Sampling Soils. USDA-NRCS',
  'FAO (2006). Guidelines for Soil Description',
  'USGS Open-File Report 2006-1195 (chips sRGB publicados)',
];

export const PASOS_COLOR = ['Preparar', 'Humedad', 'Tono', 'Valor', 'Croma', 'Resultado'] as const;

// Valor (luminosidad) y croma (saturación) típicos de la carta de suelos.
export const VALORES_COLOR = [2, 3, 4, 5, 6, 7, 8];
export const CROMAS_COLOR = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export const ADVERTENCIA_COLOR =
  'El color se determina bajo luz natural de mediodía (evita sombra azulada y bombillas cálidas), sobre la matriz del suelo limpia de raíces y recubrimientos. El estándar se describe en húmedo; si se reporta en seco, indícalo. La carta física Munsell es la referencia oficial: la vista previa digital es orientativa.';

export type GrupoColor = 'organico' | 'rojo-oxidado' | 'pardo' | 'amarillo' | 'reducido' | 'neutro';

export interface LecturaColor {
  grupo: GrupoColor;
  titulo: string;
  texto: string;
}

// Interpretación cualitativa del color (no sustituye al laboratorio). Relaciones
// establecidas en el Soil Survey Manual: colores oscuros ↔ materia orgánica;
// rojos ↔ óxidos de hierro en ambiente oxidado; matriz grisácea de bajo croma ↔
// condiciones reducidas / drenaje deficiente (gley).
export function interpretarColor(
  tono?: string | null, valor?: number | null, croma?: number | null,
): LecturaColor | null {
  if (!tono || valor === undefined || valor === null || croma === undefined || croma === null) return null;

  if (valor <= 3) {
    return {
      grupo: 'organico',
      titulo: 'Color oscuro · materia orgánica',
      texto: 'Los valores bajos (≤ 3) suelen asociarse a contenido alto de materia orgánica (humus), con mayor fertilidad potencial y mejor estructura.',
    };
  }
  if (croma <= 2 && valor >= 5) {
    return {
      grupo: 'reducido',
      titulo: 'Color grisáceo de bajo croma · posible ambiente reducido',
      texto: 'Una matriz pálida y de croma bajo (≤ 2) sugiere condiciones de reducción o drenaje deficiente (gley), o materiales pobres en hierro. Busca moteados para confirmar fluctuaciones de humedad.',
    };
  }
  if ((tono === '10R' || tono === '2.5YR' || tono === '5YR') && croma >= 4) {
    return {
      grupo: 'rojo-oxidado',
      titulo: 'Tonos rojos · óxidos de hierro (ambiente oxidado)',
      texto: 'Los matices rojos de croma alto (hematita) indican buena aireación y drenaje; el suelo se ha oxidado de forma sostenida.',
    };
  }
  if (tono === '2.5Y' || tono === '5Y') {
    return {
      grupo: 'amarillo',
      titulo: 'Tonos amarillos · hidróxidos de hierro',
      texto: 'Los matices amarillos (goetita) suelen acompañar ambientes más húmedos con drenaje moderado.',
    };
  }
  return {
    grupo: 'pardo',
    titulo: 'Tonos pardos · goetita y materia orgánica',
    texto: 'Los pardos (7.5YR–10YR) son los más frecuentes: mezcla de óxidos de hierro y materia orgánica en un régimen de humedad intermedio.',
  };
}
