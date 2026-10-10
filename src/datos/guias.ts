// Guías de método por paso del wizard. POLÍTICA DE FUENTES: solo canales
// confiables y verificables en el ámbito académico (libros, artículos,
// manuales FAO/USDA/NRCS, material publicado). Cada tarjeta cita su fuente.
export interface GuiaPaso {
  paso: 'general' | 'fisicas' | 'quimicas' | 'biologicas';
  imagen: string;
  imagenAlt: string;
  titulo: string;
  pasos: string[];
  fuente: string;
  fuenteUrl?: string;
}

export const GUIAS: GuiaPaso[] = [
  {
    paso: 'general',
    imagen: '/imagenes/1.jpg',
    imagenAlt: 'Plántula emergiendo del suelo',
    titulo: 'Muestreo representativo',
    pasos: [
      'Evalúa con el suelo húmedo y apto para labranza (prueba de la lombriz).',
      'Toma 4 sitios por cada 5 ha y dedica ~25 minutos por sitio.',
      'Guarda una muestra de referencia bajo un cerco o área sin disturbar.',
    ],
    fuente: 'Shepherd et al., Visual Soil Assessment – Field Guides, FAO, Roma, 2008',
    fuenteUrl: 'https://www.fao.org/4/i0007e/i0007e00.htm',
  },
  {
    paso: 'fisicas',
    imagen: '/imagenes/3.jpg',
    imagenAlt: 'Agregados y raíces del suelo en primer plano',
    titulo: 'Estructura a la vista (VSA / VESS)',
    pasos: [
      'Extrae un cubo de 20 cm de capa arable con la pala.',
      'Prueba de desmoronamiento por caída (drop-shatter) y observa terrones vs. agregados friables.',
      'Textura al tacto: forma cinta o salchicha; sin grietas = arenoso, cinta larga = arcilloso.',
      'Estabilidad de agregados: terrón del tamaño de una nuez en agua 5 min; ≥80 % intacto = buena.',
    ],
    fuente:
      'Shepherd, VSA Field Guides (FAO, 2008); Ball et al., Visual Evaluation of Soil Structure (Soil & Tillage Research); USDA-NRCS, Soil Survey Field and Laboratory Methods Manual (SSIR-51); UC Agriculture and Natural Resources, Cropland In-Field Soil Health Assessment (2024)',
  },
  {
    paso: 'quimicas',
    imagen: '/imagenes/4.jpg',
    imagenAlt: 'Cultivos hortícolas en crecimiento',
    titulo: 'Del campo al laboratorio',
    pasos: [
      'En campo: pH y CE con equipo portátil calibrado; efervescencia con vinagre indica carbonatos.',
      'Observa síntomas en planta (clorosis, necrosis) como proxy, nunca como diagnóstico final.',
      'En laboratorio: reporta siempre método (pH agua/KCl, Bray II/Olsen para P) junto al valor.',
    ],
    fuente:
      'USDA-NRCS, Soil Survey Field and Laboratory Methods Manual (SSIR-51); guías FAO/USDA de src/bibliography',
  },
  {
    paso: 'biologicas',
    imagen: '/imagenes/1.jpg',
    imagenAlt: 'Vida emergiendo del suelo',
    titulo: 'Puntuación visual VSA 0 · 1 · 2',
    pasos: [
      'Compara cada indicador con la guía fotográfica: 0 pobre, 1 moderado, 2 bueno.',
      'Pondera: estructura ×3, porosidad ×3, color ×2, moteado ×2, lombrices ×2.',
      'Lombrices en cubo de 20 cm: bueno >35, moderado 22–28, pobre <15.',
      'Suma ponderada: bueno >25, moderado 10–25, pobre <10.',
    ],
    fuente:
      'Shepherd, VSA Field Guides (FAO, 2008); AgResearch, Soil Health for pastoral systems (2025); Väderstad, Guide to Visual Soil Assessments',
  },
];
