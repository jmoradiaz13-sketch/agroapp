import { create } from 'zustand';

export type Paso = 'predios' | 'lote' | 'ficha' | 'sig' | 'diagnostico' | 'informe';

interface EstadoFlujo {
  predioIdentificador: string | null;
  loteNombre: string | null;
  paso: Paso;
  fijarPredio: (id: string | null) => void;
  fijarLote: (nombre: string) => void;
  irPaso: (p: Paso) => void;
}

export const usoFlujo = create<EstadoFlujo>((fijar) => ({
  predioIdentificador: localStorage.getItem('agroapp_predio') ?? null,
  loteNombre: localStorage.getItem('agroapp_lote') ?? null,
  paso: 'predios',
  fijarPredio: (id) => { if (id) { localStorage.setItem('agroapp_predio', id); fijar({ predioIdentificador: id, paso: 'lote' }); } else { localStorage.removeItem('agroapp_predio'); fijar({ predioIdentificador: null, paso: 'predios' }); } },
  fijarLote: (nombre) => { localStorage.setItem('agroapp_lote', nombre); fijar({ loteNombre: nombre, paso: 'ficha' }); },
  irPaso: (paso) => fijar({ paso })
}));
