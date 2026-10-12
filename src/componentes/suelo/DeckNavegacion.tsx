import { useState } from 'react';

// Píldora de navegación compartida por los decks de propiedades
// (físicas, químicas, biológicas): flechas + menú ▦ + puntos de avance.
// Táctil 44px vía .boton-campo en el menú de variables.
export function DeckNavegacion({
  diapositivas,
  indice,
  alIr,
}: {
  diapositivas: { id: string; titulo: string }[];
  indice: number;
  alIr: (i: number) => void;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <nav className="sticky bottom-2 z-10 mx-auto w-full max-w-[240px] bg-selva/95 backdrop-blur text-white rounded-full px-2 py-1 grid gap-1 shadow-lg" aria-label="Navegación de diapositivas">
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => alIr(indice - 1)}
          className="w-8 h-8 grid place-items-center text-sm hover:bg-white/10 rounded-full transition-colors"
          aria-label="Diapositiva anterior"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          className="px-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors h-8"
          aria-expanded={menuAbierto}
          aria-label="Menú de variables"
        >
          ▦
        </button>
        <button
          type="button"
          onClick={() => alIr(indice + 1)}
          className="w-8 h-8 grid place-items-center text-sm hover:bg-white/10 rounded-full transition-colors"
          aria-label="Diapositiva siguiente"
        >
          →
        </button>
      </div>
      {menuAbierto && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 animacion-entrada" role="tablist" aria-label="Menú de variables">
          {diapositivas.map((s, i) => (
            <button
              key={s.id} type="button" role="tab" aria-selected={indice === i}
              onClick={() => { alIr(i); setMenuAbierto(false); }}
              className={`boton-campo px-2 py-2 text-xs font-semibold rounded-sm transition-colors ${
                indice === i ? 'bg-[#059669] text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {i + 1} · {s.titulo}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-1">
        {diapositivas.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${indice === i ? 'w-5 bg-[#6ee7b7]' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>
    </nav>
  );
}
