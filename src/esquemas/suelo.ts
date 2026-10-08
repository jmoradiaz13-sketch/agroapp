import { z } from 'zod';

// Unidades de almacenamiento según AGENTS.md. Conversiones solo en presentación.
// Panel profesional de laboratorio según reporte estándar colombiano (IGAC):
// acidez, MO-N, bases-CIC, P-sales, micronutrientes y textura.
export const esquemaFichaSuelo = z.object({
  predioIdentificador: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  profundidadCm: z.number().min(0).max(200).optional(),
  laboratorio: z.string().max(200).optional(),
  phAgua: z.number().min(0).max(14).optional(),
  phKcl: z.number().min(0).max(14).optional(),
  calcioCmolKg: z.number().min(0).max(30).optional(),
  magnesioCmolKg: z.number().min(0).max(15).optional(),
  potasioCmolKg: z.number().min(0).max(5).optional(),
  sodioCmolKg: z.number().min(0).max(10).optional(),
  cicCmolKg: z.number().min(0).max(60).optional(),
  fosforoMgKg: z.number().min(0).max(500).optional(),
  materiaOrganicaPct: z.number().min(0).max(20).optional(),
  nitrogenoPct: z.number().min(0).max(2).optional(),
  conductividadDsM: z.number().min(0).max(20).optional(),
  hierroMgKg: z.number().min(0).max(2000).optional(),
  manganesoMgKg: z.number().min(0).max(2000).optional(),
  zincMgKg: z.number().min(0).max(2000).optional(),
  cobreMgKg: z.number().min(0).max(2000).optional(),
  boroMgKg: z.number().min(0).max(2000).optional(),
  arenaPct: z.number().min(0).max(100).optional(),
  limoPct: z.number().min(0).max(100).optional(),
  arcillaPct: z.number().min(0).max(100).optional(),
  // Regla NO INVENTAR DATOS: toda ficha exige fuente bibliográfica de src/
  referenciaBibliografica: z.string().min(3, 'Indica la fuente en src/, ej: guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.12')
});

export type FichaSueloFormulario = z.infer<typeof esquemaFichaSuelo>;
