import type { FichaSueloFormulario } from '../esquemas/suelo';
import {
  RANGOS_VALIDADOS, semaforoPara, type RangoValidado, type Semaforo,
} from './rangos';

type V = Partial<FichaSueloFormulario>;

export const FUENTES_QUIMICAS = {
  acidez: 'SENA La Granja (2013), Manual de Prácticas de Campo y Laboratorio de Suelos, práctica 4; USDA-NRCS, Soil Survey Manual',
  salinidad: 'guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf cap. salinidad; USDA-NRCS, Soil Survey Manual',
  materia: 'guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.12-18; manual_de_agroecologia_y_agroforesteria._practicas_para_una_agricultura_ecologica.pdf cap. fertilidad',
  bases: 'SENA La Granja (2013), prácticas 12 y 14; guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.20-25; guia_de_buenas_practicas_para_la_gestion_y_uso_sostenible_de_los_suelos.pdf cap. acidez',
  fosforo: 'guia_de_buenas_practicas_para_la_gestion_y_uso_sostenible_de_los_suelos.pdf cap. fertilidad; SENA La Granja (2013), práctica 13',
  aluminio: 'AGENTS.md §4.3; aplicacion/servicios/sig_cal.py; guia_de_buenas_practicas_para_la_gestion_y_uso_sostenible_de_los_suelos.pdf',
} as const;

export const METODOS_FOSFORO = ['Bray II', 'Olsen', 'otro'] as const;

export const OPCIONES_CARBONATOS = ['sin efervescencia', 'leve', 'fuerte'] as const;

export const CATIONES = [
  { id: 'calcioCmolKg', simbolo: 'Ca', etiqueta: 'Calcio', color: '#14736E' },
  { id: 'magnesioCmolKg', simbolo: 'Mg', etiqueta: 'Magnesio', color: '#5A6B3D' },
  { id: 'potasioCmolKg', simbolo: 'K', etiqueta: 'Potasio', color: '#D97A1A' },
  { id: 'sodioCmolKg', simbolo: 'Na', etiqueta: 'Sodio', color: '#9A6F14' },
  { id: 'aluminioCmolKg', simbolo: 'Al', etiqueta: 'Aluminio', color: '#B91C1C' },
] as const;

export type CationId = (typeof CATIONES)[number]['id'];

export function aNumero(valor: unknown): number | undefined {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : undefined;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const n = Number(valor);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function rangoDe(parametro: string): RangoValidado | undefined {
  return RANGOS_VALIDADOS.find((r) => r.parametro === parametro);
}

export function textoRango(rango: RangoValidado): string {
  return `Referencia ${rango.optimoMin}–${rango.optimoMax} ${rango.unidad}`;
}

export function lecturaRango(parametro: string, valor: unknown): { rango: RangoValidado; sem: Semaforo } | null {
  const rango = rangoDe(parametro);
  if (!rango) return null;
  return { rango, sem: semaforoPara(rango, aNumero(valor)) };
}

export const BANDAS_PH = [
  { hasta: 5.5, etiqueta: 'Ácido' },
  { hasta: 6, etiqueta: 'Moderadamente ácido' },
  { hasta: 7, etiqueta: 'Rango general 6–7' },
  { hasta: 14, etiqueta: 'Alcalino' },
] as const;

export function bandaPh(ph: number): { etiqueta: string } {
  const banda = BANDAS_PH.find((b) => ph < b.hasta) ?? BANDAS_PH[BANDAS_PH.length - 1];
  return { etiqueta: banda.etiqueta };
}

export function textoPh(ph: number | undefined): string {
  if (ph === undefined) return 'Registra el pH para ubicarlo en la escala.';
  if (ph < 5.5) return 'Ácido. La disponibilidad de nutrientes y la actividad biológica cambian; la necesidad de enmienda depende del cultivo.';
  if (ph < 6) return 'Moderadamente ácido. Revisa el cultivo y la saturación de aluminio antes de decidir una enmienda.';
  if (ph <= 7) return 'En el rango general 6–7. Confirma con el requerimiento específico del cultivo.';
  return 'Alcalino. Vigila la disponibilidad de micronutrientes y la presencia de carbonatos.';
}

export function deltaPh(agua: number | undefined, kcl: number | undefined): number | null {
  if (agua === undefined || kcl === undefined) return null;
  return Math.round((kcl - agua) * 10) / 10;
}

export function textoDeltaPh(delta: number | null): string {
  if (delta === null) return 'Registra pH en agua y en KCl para calcular la diferencia.';
  if (delta < 0) return 'ΔpH negativo: el KCl desplaza H y Al de la carga variable. Es un indicador de acidez potencial; interpreta junto con la saturación de Al.';
  if (delta > 0) return 'ΔpH positivo: poco frecuente. Verifica la calibración del electrodo y el reporte del laboratorio.';
  return 'ΔpH cercano a cero: sin cambio apreciable entre ambos métodos.';
}

export function textoSalinidad(ce: number | undefined, laboratorio = true): string {
  if (ce === undefined) return 'Registra la conductividad eléctrica para ubicarla en el rango.';
  if (!laboratorio) return 'Lectura de campo orientativa. El rango validado 0–2 dS/m corresponde a la CE de laboratorio.';
  if (ce <= 2) return 'Dentro del rango validado 0–2 dS/m. Mantén el monitoreo, sobre todo con fertilización intensiva.';
  return 'Por encima de 2 dS/m: exceso según la guía. Mejora el drenaje, evita fertilizantes salinos y confirma con laboratorio.';
}

export function textoMateriaOrganica(mo: number | undefined): string {
  if (mo === undefined) return 'Registra la materia orgánica para ubicarla en el rango.';
  if (mo < 2) return 'Baja (< 2 %): aporta compost, cobertura y rotación para reconstruir la reserva orgánica.';
  if (mo <= 5) return 'Adecuada (2–5 %): mantén el aporte de residuos y la cobertura del suelo.';
  return 'Alta (> 5 %): buena reserva orgánica. Evita excesos de nitrógeno que desbalanceen la relación C/N.';
}

export function textoNitrogeno(n: number | undefined): string {
  if (n === undefined) return 'Registra el nitrógeno total para ubicarlo en el rango.';
  if (n < 0.1) return 'Bajo (< 0,1 %): considera leguminosas de cobertura y abono verde.';
  if (n <= 0.3) return 'Adecuado (0,1–0,3 %): fracciona los aportes nitrogenados.';
  return 'Alto (> 0,3 %): reduce el aporte y vigila la lixiviación.';
}

export function textoFosforo(p: number | undefined): string {
  if (p === undefined) return 'Registra el fósforo disponible para ubicarlo en el rango.';
  if (p < 15) return 'Bajo (< 15 mg/kg): evalúa enmienda fosfórica de liberación lenta y micorrizas; confirma el método extractante.';
  if (p <= 40) return 'Óptimo (15–40 mg/kg): mantén el manejo y verifica la tendencia en el próximo muestreo.';
  return 'Alto (> 40 mg/kg): suspende aportes y revisa el riesgo de fijación y escorrentía.';
}

export interface DerivadosBases {
  sumaBases: number | null;
  saturacionBasesPct: number | null;
  saturacionAlPct: number | null;
  caMg: number | null;
  mgK: number | null;
  caMgK: number | null;
}

function cociente(a: number | undefined, b: number | undefined): number | null {
  if (a === undefined || b === undefined || b === 0) return null;
  return Math.round((a / b) * 100) / 100;
}

export function derivarBases(valores: V): DerivadosBases {
  const ca = aNumero(valores.calcioCmolKg);
  const mg = aNumero(valores.magnesioCmolKg);
  const k = aNumero(valores.potasioCmolKg);
  const na = aNumero(valores.sodioCmolKg);
  const al = aNumero(valores.aluminioCmolKg);
  const cic = aNumero(valores.cicCmolKg);

  const basesCompletas = ca !== undefined && mg !== undefined && k !== undefined && na !== undefined;
  const sumaBases = basesCompletas ? Math.round((ca + mg + k + na) * 100) / 100 : null;
  const cicValida = cic !== undefined && cic > 0;
  const saturacionBasesPct = sumaBases !== null && cicValida
    ? Math.round((sumaBases / cic) * 1000) / 10
    : null;
  const saturacionAlPct = al !== undefined && cicValida
    ? Math.round((al / cic) * 1000) / 10
    : null;
  const sumaCaMg = ca !== undefined && mg !== undefined ? ca + mg : undefined;

  return {
    sumaBases,
    saturacionBasesPct,
    saturacionAlPct,
    caMg: cociente(ca, mg),
    mgK: cociente(mg, k),
    caMgK: cociente(sumaCaMg, k),
  };
}

export const SLIDE_DE_VARIABLE_QUIMICA: Record<string, number> = {
  acidez: 0, salinidad: 1, materia: 2, bases: 3, fosforo: 4,
};

export const META_AL_PCT = 20;

export function textoAvisosBases(valores: V): string[] {
  const d = derivarBases(valores);
  const cic = aNumero(valores.cicCmolKg);
  const al = aNumero(valores.aluminioCmolKg);
  const avisos: string[] = [];
  if (d.sumaBases !== null && cic !== undefined && d.sumaBases > cic + 0.01) {
    avisos.push(`La suma de bases (${d.sumaBases} cmol/kg) supera la CIC (${cic} cmol/kg). Revisa el reporte.`);
  }
  if (al !== undefined && cic !== undefined && al > cic + 0.01) {
    avisos.push(`El aluminio intercambiable (${al} cmol/kg) supera la CIC (${cic} cmol/kg). Revisa el reporte.`);
  }
  return avisos;
}

export function textoCationesRegistrados(valores: V, cic: number | undefined): string {
  const registrados = CATIONES.filter((c) => aNumero(valores[c.id]) !== undefined).length;
  if (cic === undefined || cic <= 0) return 'Registra la CIC para ver la proporción de cada catión.';
  return `${registrados} de ${CATIONES.length} cationes registrados. La barra usa la CIC como denominador.`;
}
