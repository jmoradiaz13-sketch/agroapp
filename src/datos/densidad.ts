// Densidad aparente del suelo. POLÍTICA DE FUENTES (§2.5): métodos e
// interpretación provienen de literatura publicada; no se inventan umbrales.
//
// Métodos: cilindro (Blake & Hartge 1986), terrón parafinado (Grossman & Reinsch
// 2002), reporte de laboratorio. Interpretación por clase textural: USDA-NRCS,
// Soil Quality Indicators – Bulk Density (Arshad, Lowery & Grossman 1996).
import type { EstadoDensidad } from './fisicas';

export const FUENTES_DENSIDAD_METODO = [
  'USDA-NRCS. Soil Quality Indicators – Bulk Density (Arshad, Lowery & Grossman 1996)',
  'Blake & Hartge (1986). Bulk Density. En: Methods of Soil Analysis, Part 1 (método del cilindro)',
  'Grossman & Reinsch (2002). Bulk Density and Linear Extensibility (método del terrón)',
  'SENA La Granja (2013). Manual de Prácticas de Campo y Laboratorio de Suelos (Jordán 2005)',
];

export const PASOS_DENSIDAD = ['Preparar', 'Método', 'Medición', 'Resultado'] as const;

export type MetodoDensidad = 'anillo' | 'parafina' | 'directo';

export interface OpcionMetodo { id: MetodoDensidad; titulo: string; detalle: string }

export const METODOS_DENSIDAD: OpcionMetodo[] = [
  { id: 'anillo', titulo: 'Cilindro (anillo)', detalle: 'Muestra indisturbada de volumen conocido; se seca a 105 °C y se pesa.' },
  { id: 'parafina', titulo: 'Terrón (parafina)', detalle: 'Terrón parafinado; el volumen se mide por desplazamiento.' },
  { id: 'directo', titulo: 'Reporte de laboratorio', detalle: 'Transcribe la densidad aparente ya reportada.' },
];

export const ADVERTENCIA_DENSIDAD =
  'La densidad aparente depende de la textura y del estado de humedad: interprétala siempre por clase textural. Usa muestra indisturbada y seca a 105 °C hasta peso constante.';

export function textoEstadoDensidad(estado: EstadoDensidad): string {
  if (estado === 'optimo') return 'Densidad en rango favorable: buena porosidad para aire, agua y raíces.';
  if (estado === 'vigilar') return 'Densidad intermedia: puede reducir aireación e infiltración. Revisa con VESS y evita el tráfico en húmedo.';
  return 'Densidad alta: puede restringir el crecimiento radical y el movimiento de agua. Considera descompactación y coberturas.';
}
