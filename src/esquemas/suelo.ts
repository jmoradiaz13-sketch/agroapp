import { z } from 'zod';

// Unidades de almacenamiento según AGENTS.md. Conversiones solo en presentación.
// Panel completo del plan "Determina las características de tu suelo":
// general + físicas (campo/lab) + químicas (campo/lab) + biológicas (campo/lab).
const numero = (max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : Number(v)),
    z.number().min(0).max(max).optional()
  );

export const esquemaFichaSuelo = z.object({
  predioIdentificador: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  tipoEvaluacion: z.enum(['campo', 'laboratorio', 'mixta']).optional(),
  climaReciente: z.string().max(500).optional(),
  profundidadCm: numero(200),
  laboratorio: z.string().max(200).optional(),
  // Físicas campo
  texturaTacto: z.string().max(100).optional(),
  compactacion: z.string().max(100).optional(),
  infiltracion: z.string().max(100).optional(),
  estructuraDesc: z.string().max(100).optional(),
  colorMunsell: z.string().max(50).optional(),
  profundidadEfectivaCm: numero(300),
  // Físicas laboratorio
  arenaPct: numero(100),
  limoPct: numero(100),
  arcillaPct: numero(100),
  densidadAparente: numero(3),
  porosidadPct: numero(100),
  capacidadCampoPct: numero(100),
  pmpPct: numero(100),
  // Químicas campo
  phCampo: numero(14),
  ceCampo: numero(20),
  carbonatos: z.string().max(100).optional(),
  sintomasVisuales: z.string().max(1000).optional(),
  // Químicas laboratorio
  phAgua: numero(14),
  phKcl: numero(14),
  calcioCmolKg: numero(30),
  magnesioCmolKg: numero(15),
  potasioCmolKg: numero(5),
  sodioCmolKg: numero(10),
  aluminioCmolKg: numero(10),
  saturacionAlPct: numero(100),
  cicCmolKg: numero(60),
  fosforoMgKg: numero(500),
  azufreMgKg: numero(2000),
  materiaOrganicaPct: numero(20),
  nitrogenoPct: numero(2),
  conductividadDsM: numero(20),
  hierroMgKg: numero(2000),
  manganesoMgKg: numero(2000),
  zincMgKg: numero(2000),
  cobreMgKg: numero(2000),
  boroMgKg: numero(2000),
  // Biológicas
  lombricesConteo: numero(10000),
  nodulacion: z.string().max(100).optional(),
  olorSuelo: z.string().max(100).optional(),
  descomposicionMo: z.string().max(100).optional(),
  respiracionSuelo: numero(10000),
  carbonoBiomasa: numero(10000),
  micorrizas: z.string().max(100).optional(),
  coberturaVegetalPct: numero(100),
  // Regla NO INVENTAR DATOS: toda ficha exige fuente bibliográfica de src/
  referenciaBibliografica: z.string().min(3, 'Indica la fuente en src/, ej: guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.12')
}).superRefine((d, ctx) => {
  // Validación plan §3.2: la granulometría no puede sumar más de 100 %
  const partes = [d.arenaPct, d.limoPct, d.arcillaPct].filter((v): v is number => typeof v === 'number');
  if (partes.length === 3 && partes.reduce((a, b) => a + b, 0) > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['arcillaPct'], message: 'Arena + limo + arcilla no puede superar 100 %' });
  }
});

export type FichaSueloFormulario = z.infer<typeof esquemaFichaSuelo>;
