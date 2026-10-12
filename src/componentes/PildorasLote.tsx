import { useEffect, useState } from 'react';
import { baseDatos, type LoteLocal } from '../base_datos/local';
import { usoFlujo } from '../estado/usoFlujo';

// Píldoras de lote (ref_2): selector táctil del lote activo para
// ficha, mapa y muestreo. Sincronizado con el flujo global.
export function PildorasLote({ predioIdentificador }: { predioIdentificador: string }) {
  const { loteNombre, fijarLote } = usoFlujo();
  const [lotes, setLotes] = useState<LoteLocal[]>([]);

  useEffect(() => {
    void baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).toArray().then(setLotes);
  }, [predioIdentificador]);

  if (lotes.length === 0) return null;

  return (
    <div className="scroll-sutil flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Lote activo">
      {lotes.map((l) => (
        <button
          key={l.id}
          type="button"
          role="tab"
          aria-selected={loteNombre === l.nombre}
          onClick={() => fijarLote(l.nombre)}
          className={`boton-campo shrink-0 whitespace-nowrap px-4 py-2 rounded-sm text-xs font-semibold transition-colors ${
            loteNombre === l.nombre
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-white/10 text-white/70 border border-white/15 hover:bg-white/15'
          }`}
        >
          {l.nombre}
        </button>
      ))}
    </div>
  );
}
