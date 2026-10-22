import { z } from 'zod';

// Unidades de almacenamiento según AGENTS.md. Conversiones solo en presentación.
// Panel completo del plan "Determina las características de tu suelo":
// general + físicas (campo/lab) + químicas (campo/lab) + biológicas (campo/lab).
const aNumeroOpcional = (v: unknown): number | undefined => {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const numero = (max: number) =>
  z.preprocess(aNumeroOpcional, z.number().min(0).max(max).optional());

const numeroEntre = (min: number, max: number) =>
  z.preprocess(aNumeroOpcional, z.number().min(min).max(max).optional());

const enteroEntre = (min: number, max: number) =>
  z.preprocess(aNumeroOpcional, z.number().int().min(min).max(max).optional());

const textoOpcional = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : v);

export const esquemaFichaSuelo = z.object({
  predioIdentificador: z.string().min(1, 'Requerido'),
  // Lote/parcela opcional: la ficha siempre queda bajo un predio.
  loteNombre: z.string().max(200).optional(),
  // Fecha opcional en formulario: si falta, se repone a hoy al guardar (trazabilidad §2.1).
  fecha: z.string().optional(),
  tipoEvaluacion: z.preprocess(textoOpcional, z.enum(['campo', 'laboratorio', 'mixta']).optional()),
  climaReciente: z.string().max(500).optional(),
  profundidadCm: numero(200),
  laboratorio: z.string().max(200).optional(),
  // Sitio de muestreo (Datos del terreno)
  latitud: numeroEntre(-90, 90),
  longitud: numeroEntre(-180, 180),
  precisionM: numero(10000),
  msnm: numeroEntre(-500, 6000),
  pendienteSitioPct: numero(200),
  posicionRelieve: z.preprocess(textoOpcional, z.enum(['cima', 'hombro', 'ladera', 'pie', 'valle']).optional()),
  usoActual: z.string().max(200).optional(),
  solicitante: z.string().max(200).optional(),
  tenenciaSitio: z.preprocess(textoOpcional, z.enum(['propietario', 'arrendatario', 'poseedor', 'otro']).optional()),
  manejoReciente: z.string().max(1000).optional(),
  vereda: z.string().max(100).optional(),
  municipio: z.string().max(100).optional(),
  departamento: z.string().max(100).optional(),
  // Físicas campo
  texturaTacto: z.string().max(100).optional(),
  compactacion: z.string().max(100).optional(),
  infiltracion: z.string().max(100).optional(),
  estructuraDesc: z.string().max(100).optional(),
  estructuraVess: enteroEntre(1, 5),
  colorMunsell: z.string().max(50).optional(),
  munsellH: z.string().max(10).optional(),
  munsellV: numero(10),
  munsellC: numero(10),
  colorEstado: z.string().max(20).optional(),
  profundidadEfectivaCm: numero(300),
  // Físicas laboratorio
  arenaPct: numero(100),
  limoPct: numero(100),
  arcillaPct: numero(100),
  densidadAparente: numero(3),
  densidadReal: numero(3),
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
  metodoFosforo: z.preprocess(textoOpcional, z.enum(['Bray II', 'Olsen', 'otro']).optional()),
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
  // Referencia opcional: se cuadra después (fuente registrada, no necesariamente PDF)
  referenciaBibliografica: z.string().max(300).optional()
}).superRefine((d, ctx) => {
  // Validación plan §3.2: la granulometría no puede sumar más de 100 %
  const partes = [d.arenaPct, d.limoPct, d.arcillaPct].filter((v): v is number => typeof v === 'number');
  if (partes.length === 3 && partes.reduce((a, b) => a + b, 0) > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['arcillaPct'], message: 'Arena + limo + arcilla no puede superar 100 %' });
  }
});

export type FichaSueloFormulario = z.infer<typeof esquemaFichaSuelo>;
