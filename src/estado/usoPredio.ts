import { create } from 'zustand';

interface EstadoPredio {
  predioActivoIdentificador: string | null;
  fechaCache: string | null;
  fijarPredio: (identificador: string, fechaCache: string) => void;
  limpiar: () => void;
}

// Estado local (Zustand). Lo remoto va con TanStack Query.
export const usoPredio = create<EstadoPredio>((fijar) => ({
  predioActivoIdentificador: null,
  fechaCache: null,
  fijarPredio: (identificador, fechaCache) => fijar({ predioActivoIdentificador: identificador, fechaCache }),
  limpiar: () => fijar({ predioActivoIdentificador: null, fechaCache: null })
}));
