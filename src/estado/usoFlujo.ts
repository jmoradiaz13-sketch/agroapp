import { create } from 'zustand';

export type Paso = 'predios' | 'lote' | 'ficha' | 'sig' | 'simulador' | 'diseno' | 'diagnostico' | 'informe';

interface EstadoFlujo {
  predioIdentificador: string | null;
  loteNombre: string | null;
  paso: Paso;
  fijarPredio: (id: string | null) => void;
  fijarLote: (nombre: string | null) => void;
  irPaso: (p: Paso) => void;
}

export const usoFlujo = create<EstadoFlujo>((fijar) => ({
  predioIdentificador: localStorage.getItem('agroapp_predio') ?? null,
  loteNombre: localStorage.getItem('agroapp_lote') ?? null,
  paso: 'predios',
  fijarPredio: (id) => {
    if (id) {
      localStorage.setItem('agroapp_predio', id);
      localStorage.removeItem('agroapp_lote');
      fijar({ predioIdentificador: id, loteNombre: null, paso: 'lote' });
    } else {
      localStorage.removeItem('agroapp_predio');
      localStorage.removeItem('agroapp_lote');
      fijar({ predioIdentificador: null, loteNombre: null, paso: 'predios' });
    }
  },
  fijarLote: (nombre) => {
    if (nombre) {
      localStorage.setItem('agroapp_lote', nombre);
      fijar({ loteNombre: nombre, paso: 'ficha' });
    } else {
      localStorage.removeItem('agroapp_lote');
      fijar({ loteNombre: null, paso: 'lote' });
    }
  },
  irPaso: (paso) => fijar({ paso })
}));
