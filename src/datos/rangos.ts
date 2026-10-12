// Espejo local de aplicacion/datos/referencias.py (7 parámetros con rango validado).
// Cada umbral cita su fuente registrada. Los parámetros fuera
// de este catálogo se registran como serie temporal SIN interpretar.
export interface RangoValidado {
  parametro: string;
  etiqueta: string;
  unidad: string;
  deficienteMax: number;
  optimoMin: number;
  optimoMax: number;
  fuente: string;
}

export const RANGOS_VALIDADOS: RangoValidado[] = [
  {
    parametro: 'materiaOrganicaPct', etiqueta: 'Materia orgánica', unidad: '%',
    deficienteMax: 2.0, optimoMin: 2.0, optimoMax: 5.0,
    fuente: 'guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.12-18',
  },
  {
    parametro: 'fosforoMgKg', etiqueta: 'Fósforo', unidad: 'mg/kg',
    deficienteMax: 15.0, optimoMin: 15.0, optimoMax: 40.0,
    fuente: 'guia_de_buenas_practicas_para_la_gestion_y_uso_sostenible_de_los_suelos.pdf cap. fertilidad',
  },
  {
    parametro: 'potasioCmolKg', etiqueta: 'Potasio', unidad: 'cmol/kg',
    deficienteMax: 0.2, optimoMin: 0.2, optimoMax: 0.6,
    fuente: 'guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.20-25',
  },
  {
    parametro: 'calcioCmolKg', etiqueta: 'Calcio', unidad: 'cmol/kg',
    deficienteMax: 3.0, optimoMin: 3.0, optimoMax: 10.0,
    fuente: 'guia_de_buenas_practicas_para_la_gestion_y_uso_sostenible_de_los_suelos.pdf cap. acidez',
  },
  {
    parametro: 'magnesioCmolKg', etiqueta: 'Magnesio', unidad: 'cmol/kg',
    deficienteMax: 0.8, optimoMin: 0.8, optimoMax: 3.0,
    fuente: 'guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.20-25',
  },
  {
    parametro: 'conductividadDsM', etiqueta: 'Conductividad eléctrica', unidad: 'dS/m',
    deficienteMax: 0.0, optimoMin: 0.0, optimoMax: 2.0,
    fuente: 'guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf cap. salinidad',
  },
  {
    parametro: 'nitrogenoPct', etiqueta: 'Nitrógeno', unidad: '%',
    deficienteMax: 0.1, optimoMin: 0.1, optimoMax: 0.3,
    fuente: 'manual_de_agroecologia_y_agroforesteria._practicas_para_una_agricultura_ecologica.pdf cap. fertilidad',
  },
];

export type Semaforo = 'bajo' | 'optimo' | 'alto' | 'sin-dato';

export const COLOR_SEMAFORO: Record<Semaforo, string> = {
  bajo: 'bg-red-600',
  optimo: 'bg-[#14736E]',
  alto: 'bg-amber-500',
  'sin-dato': 'bg-neutral-300',
};

export const TEXTO_SEMAFORO: Record<Semaforo, string> = {
  bajo: 'Bajo',
  optimo: 'Óptimo',
  alto: 'Alto',
  'sin-dato': 'Sin dato',
};

export function semaforoPara(rango: RangoValidado, valor: number | undefined): Semaforo {
  if (valor === undefined || Number.isNaN(valor)) return 'sin-dato';
  if (valor < rango.deficienteMax) return 'bajo';
  if (valor > rango.optimoMax) return 'alto';
  return 'optimo';
}
