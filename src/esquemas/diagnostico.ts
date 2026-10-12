export interface Hallazgo {
  parametro: string;
  unidad: string;
  valor: number;
  estado: 'deficiente' | 'optimo' | 'exceso';
  porque: string;
  referenciaBibliografica: string;
}

export interface PuntajeSalud {
  puntaje: number;
  nivel: 'bueno' | 'moderado' | 'pobre' | 'sin-datos';
  detalle: string;
  n_optimo: number;
  n_total: number;
  fuente: string;
}

export interface RelacionesCationicas {
  ca_mg: number | null;
  mg_k: number | null;
  ca_mg_k: number | null;
  ca_al: number | null;
  nota: string;
}

export interface Diagnostico {
  predioIdentificador: string;
  fichaVersion: number;
  hallazgos: Hallazgo[];
  puntajeSalud?: PuntajeSalud;
  relaciones?: RelacionesCationicas;
}

export type DecisionTecnico = 'aceptada' | 'rechazada' | 'editada';
