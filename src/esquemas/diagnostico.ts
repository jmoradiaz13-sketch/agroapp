export interface Hallazgo {
  parametro: string;
  unidad: string;
  valor: number;
  estado: 'deficiente' | 'optimo' | 'exceso';
  porque: string;
  referenciaBibliografica: string;
}

export interface Diagnostico {
  predioIdentificador: string;
  fichaVersion: number;
  hallazgos: Hallazgo[];
}

export type DecisionTecnico = 'aceptada' | 'rechazada' | 'editada';
