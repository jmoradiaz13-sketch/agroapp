// Determinación de textura al tacto. POLÍTICA DE FUENTES (§2.5): el flujo, las
// lecturas y los umbrales provienen de literatura publicada y verificable; aquí
// no se inventa ningún criterio agronómico.
//
// Flujo: USDA-NRCS "Guide to Texture by Feel" (Thien 1979). Cintas de 2,5 y 5 cm
// según FAO, ejercicios de campo de textura (método de la cinta). La estructura de
// interacción se inspira en el USTF (ISRIC / TU München, 2020) como referencia de UX.
import { CLASES_ES, type ClaseTextural } from './fisicas';

export const FUENTES_TEXTURA = [
  'Thien, S.J. (1979). A flow diagram for teaching texture by feel analysis. Journal of Agronomic Education 8:54–55',
  'USDA-NRCS. Guide to Texture by Feel (modificado de Thien 1979)',
  'FAO (2023). Field exercise P01b – Texture, ribbon method',
  'ISRIC / TU München (2020). The Ultimate Soil Texture Flow Chart (referencia de interacción)',
  'USDA-NRCS. Soil Quality Indicators – Available Water Capacity (2008)',
  'USDA-NRCS. Soil Survey Manual (manejo y laborabilidad según clase textural)',
];

export type IlustracionTextura = 'bola' | 'cinta' | 'arenoso' | 'harinoso' | 'pegajoso';

export interface OpcionTextura { texto: string; destino: string }

export type NodoTextura =
  | { id: string; tipo: 'accion'; ilustracion: IlustracionTextura; titulo: string; detalle: string; destino: string }
  | { id: string; tipo: 'pregunta'; ilustracion: IlustracionTextura; titulo: string; ayuda: string; opciones: OpcionTextura[] }
  | { id: string; tipo: 'resultado'; clase: ClaseTextural };

// Nodos de tacto reutilizados por varias ramas de la cinta (mismo destino → misma clase).
function nodoTacto(id: string, arenoso: ClaseTextural, harinoso: ClaseTextural, neutro: ClaseTextural, contexto: string): NodoTextura {
  return {
    id,
    tipo: 'pregunta',
    ilustracion: 'harinoso',
    titulo: `Exprime una pizca mojada en la palma: ¿cómo se siente el tacto? (${contexto})`,
    ayuda: 'Áspero = predomina la arena. Suave o harinoso = predomina el limo. Ni uno ni otro = textura equilibrada (franca).',
    opciones: [
      { texto: 'Áspero (arenoso)', destino: `res:${arenoso}` },
      { texto: 'Suave / harinoso', destino: `res:${harinoso}` },
      { texto: 'Ni áspero ni suave', destino: `res:${neutro}` },
    ],
  };
}

function resultado(clase: ClaseTextural): NodoTextura {
  return { id: `res:${clase}`, tipo: 'resultado', clase };
}

export const NODOS: Record<string, NodoTextura> = {
  preparar: {
    id: 'preparar',
    tipo: 'accion',
    ilustracion: 'bola',
    titulo: 'Prepara la muestra',
    detalle: 'Toma unos 25 g de tierra fina (sin piedras ni raíces) y humedécela gota a gota mientras amasas, hasta que quede plástica y moldeable como masilla. No debe quedar seca ni encharcada: escúrrela si hace falta.',
    destino: 'bola',
  },
  bola: {
    id: 'bola',
    tipo: 'pregunta',
    ilustracion: 'bola',
    titulo: '¿La muestra húmeda forma una bola que no se deshace al manipularla?',
    ayuda: 'Aprieta la pasta en la palma y forma una bola de unos 3 cm. Si se desmorona, el contenido de arcilla es bajo.',
    opciones: [
      { texto: 'Sí, forma bola y se mantiene', destino: 'cinta' },
      { texto: 'No, se desmorona', destino: 'sin-bola' },
    ],
  },
  'sin-bola': {
    id: 'sin-bola',
    tipo: 'pregunta',
    ilustracion: 'arenoso',
    titulo: 'Frota la tierra entre los dedos: ¿se siente claramente áspera?',
    ayuda: 'La sensación áspera corresponde a granos de arena visibles y detectables al tacto.',
    opciones: [
      { texto: 'Muy áspera', destino: 'res:arena' },
      { texto: 'Poco áspera', destino: 'res:arena-franca' },
    ],
  },
  cinta: {
    id: 'cinta',
    tipo: 'pregunta',
    ilustracion: 'cinta',
    titulo: 'Presa la bola entre el pulgar y el índice y empuja hacia arriba: ¿forma una cinta?',
    ayuda: 'Se busca una cinta de grosor uniforme que se sostenga por su propio peso antes de romperse.',
    opciones: [
      { texto: 'Sí, forma cinta', destino: 'cinta-longitud' },
      { texto: 'No forma cinta', destino: 'sin-cinta-tacto' },
    ],
  },
  'cinta-longitud': {
    id: 'cinta-longitud',
    tipo: 'pregunta',
    ilustracion: 'cinta',
    titulo: '¿Cuánto se extiende la cinta antes de romperse por su propio peso?',
    ayuda: 'Referencia de campo: cada 2,5 cm de cinta equivale, en promedio, a unos 10 % más de arcilla.',
    opciones: [
      { texto: 'Menos de 2,5 cm', destino: 'cinta-corta-tacto' },
      { texto: 'Entre 2,5 y 5 cm', destino: 'cinta-media-tacto' },
      { texto: 'Más de 5 cm', destino: 'cinta-larga-tacto' },
    ],
  },
  'sin-cinta-tacto': nodoTacto('sin-cinta-tacto', 'franco-arenoso', 'franco-limoso', 'franco', 'sin cinta'),
  'cinta-corta-tacto': nodoTacto('cinta-corta-tacto', 'franco-arenoso', 'franco-limoso', 'franco', 'cinta menor de 2,5 cm'),
  'cinta-media-tacto': nodoTacto('cinta-media-tacto', 'franco-arcillo-arenoso', 'franco-arcillo-limoso', 'franco-arcilloso', 'cinta de 2,5 a 5 cm'),
  'cinta-larga-tacto': nodoTacto('cinta-larga-tacto', 'arcillo-arenoso', 'arcillo-limoso', 'arcilla', 'cinta mayor de 5 cm'),
  'res:arena': resultado('arena'),
  'res:arena-franca': resultado('arena-franca'),
  'res:franco-arenoso': resultado('franco-arenoso'),
  'res:franco-limoso': resultado('franco-limoso'),
  'res:franco': resultado('franco'),
  'res:franco-arcillo-arenoso': resultado('franco-arcillo-arenoso'),
  'res:franco-arcillo-limoso': resultado('franco-arcillo-limoso'),
  'res:franco-arcilloso': resultado('franco-arcilloso'),
  'res:arcillo-arenoso': resultado('arcillo-arenoso'),
  'res:arcillo-limoso': resultado('arcillo-limoso'),
  'res:arcilla': resultado('arcilla'),
};

export const INICIO = 'preparar';
export const PASOS = ['Preparar', 'Bola', 'Cinta', 'Tacto', 'Resultado'] as const;

// Paso del recorrido (0–4) al que pertenece cada nodo; alimenta el indicador de progreso.
export function pasoDeNodo(id: string): number {
  if (id === 'preparar') return 0;
  if (id === 'bola' || id === 'sin-bola') return 1;
  if (id === 'cinta' || id === 'cinta-longitud') return 2;
  if (id.endsWith('-tacto')) return 3;
  return 4;
}

// Etiqueta legible de cada clase (coincide con CLASES_ES).
export function nombreClase(clase: ClaseTextural): string {
  return CLASES_ES[clase];
}

export type NivelAgua = 'Baja' | 'Media' | 'Alta';
export type NivelArcilla = 'Bajo' | 'Medio' | 'Alto' | 'Muy alto';

export interface InfoClase {
  agua: NivelAgua;
  aguaTexto: string;
  manejo: string;
  arcilla: NivelArcilla;
  lectura: string;
}

// Retención de agua relativa y manejo según clase textural.
// Base: USDA-NRCS, Soil Quality Indicators – Available Water Capacity (2008) y
// Soil Survey Manual (laborabilidad, sellado, compactación). Valores cualitativos
// a propósito: la cifra exacta solo la fija el laboratorio.
export const INFO_CLASE: Record<ClaseTextural, InfoClase> = {
  'arena': {
    agua: 'Baja', aguaTexto: 'Retiene poca agua: los riegos se pierden rápido y hay escasa reserva para las sequías.',
    manejo: 'Drena en exceso y se trabaja con facilidad. Cuidar la fertilidad (lavado de nutrientes) con materia orgánica y coberturas.',
    arcilla: 'Bajo', lectura: 'Áspera; no forma bola ni cinta.',
  },
  'arena-franca': {
    agua: 'Baja', aguaTexto: 'Poca retención de agua; requiere riegos más frecuentes.',
    manejo: 'Muy laborable y bien drenada, con baja retención de nutrientes. Aportar materia orgánica para mejorar la reserva hídrica.',
    arcilla: 'Bajo', lectura: 'Áspera; forma bola débil pero sin cinta.',
  },
  'franco-arenoso': {
    agua: 'Media', aguaTexto: 'Retención moderada: buen equilibrio inicial entre agua y aire.',
    manejo: 'Fácil de trabajar y bien aireada; vigilar la fertilidad por lixiviación moderada.',
    arcilla: 'Bajo', lectura: 'Áspera; sin cinta o cinta muy corta.',
  },
  'franco': {
    agua: 'Media', aguaTexto: 'Buena retención y buen balance agua-aire: es el suelo de referencia.',
    manejo: 'Amplio rango de humedad para labrar; estructura estable. Es la condición deseable a la que apuntan las prácticas de manejo.',
    arcilla: 'Medio', lectura: 'Ni áspera ni suave; no forma cinta o forma cinta corta.',
  },
  'franco-limoso': {
    agua: 'Alta', aguaTexto: 'Alta retención de agua, de las mayores entre las clases texturales.',
    manejo: 'Puede sellarse en superficie y erosionar; evita el laboreo en húmedo y protege el suelo con coberturas.',
    arcilla: 'Medio', lectura: 'Suave o harinosa; sin cinta o cinta corta.',
  },
  'limo': {
    agua: 'Alta', aguaTexto: 'Retención de agua alta.',
    manejo: 'Muy erosionable por agua y de estructura frágil; mantener cobertura permanente y mínimo laboreo.',
    arcilla: 'Bajo', lectura: 'Muy harinosa; no se distingue bien al tacto (conviene confirmar en laboratorio).',
  },
  'franco-arcillo-arenoso': {
    agua: 'Media', aguaTexto: 'Retención moderada de agua.',
    manejo: 'Trabajable, pero conviene vigilar la compactación por el componente arcilloso.',
    arcilla: 'Medio', lectura: 'Áspera con cinta de 2,5 a 5 cm.',
  },
  'franco-arcilloso': {
    agua: 'Alta', aguaTexto: 'Buena retención de agua.',
    manejo: 'Rango estrecho de humedad para labrar; riesgo de compactación. Trabajar en el punto óptimo de humedad.',
    arcilla: 'Medio', lectura: 'Equilibrada con cinta de 2,5 a 5 cm.',
  },
  'franco-arcillo-limoso': {
    agua: 'Alta', aguaTexto: 'Alta retención de agua.',
    manejo: 'Estructura frágil y sensible al sellado; evitar el tráfico y el laboreo en húmedo.',
    arcilla: 'Alto', lectura: 'Suave o harinosa con cinta de 2,5 a 5 cm.',
  },
  'arcillo-arenoso': {
    agua: 'Media', aguaTexto: 'Retención de agua media a alta.',
    manejo: 'Plástica, con rango estrecho de laborabilidad; cuidar la compactación.',
    arcilla: 'Alto', lectura: 'Áspera con cinta mayor de 5 cm.',
  },
  'arcillo-limoso': {
    agua: 'Alta', aguaTexto: 'Alta retención de agua.',
    manejo: 'Muy plástica; alto riesgo de compactación y encharcamiento. Drenaje y trabajo en el punto óptimo de humedad.',
    arcilla: 'Alto', lectura: 'Suave con cinta mayor de 5 cm.',
  },
  'arcilla': {
    agua: 'Alta', aguaTexto: 'Alta retención total, aunque parte del agua queda poco disponible para las plantas.',
    manejo: 'Rango muy estrecho de humedad para labrar; se compacta y encharca con facilidad. Trabajar solo en el punto óptimo de humedad y proteger la estructura.',
    arcilla: 'Muy alto', lectura: 'Cinta larga; pegajosa y brillante al amasarla.',
  },
};

export const ADVERTENCIA_TEXTURA =
  'La determinación al tacto es una estimación de campo: puede acercarse a los límites entre clases. El análisis granulométrico de laboratorio es el que confirma la clase USDA.';
