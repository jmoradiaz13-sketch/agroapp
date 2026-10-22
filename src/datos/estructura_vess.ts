import { FUENTE_VESS } from './fisicas';

// Flujo VESS (Visual Evaluation of Soil Structure, Ball et al.): el técnico
// extrae un bloque de 20 cm, lo abre y lo compara con la escala Sq1–Sq5.
export const PASOS_ESTRUCTURA = ['Preparar', 'Puntuar', 'Contexto', 'Resultado'] as const;

export const FUENTES_ESTRUCTURA = [
  FUENTE_VESS,
  'USDA-NRCS, Soil Quality Indicators – Soil Structure (2008)',
];

export const ADVERTENCIA_ESTRUCTURA =
  'Puntúa con humedad de campo: un suelo seco se ve más firme y uno saturado se deshace. No compactes el bloque antes de abrirlo.';

// Lectura rápida del puntaje: 1–2 favorable, 3 intermedia, 4–5 compactada.
export function textoEstadoEstructura(sq: number): string {
  if (sq <= 2) return 'Estructura favorable: agregados friables y poros continuos para raíces y agua.';
  if (sq === 3) return 'Estructura moderada: conviven agregados friables y terrones firmes. Vigila el manejo.';
  return 'Estructura compactada: dominan terrones firmes o masa densa; las raíces quedan en grietas.';
}
