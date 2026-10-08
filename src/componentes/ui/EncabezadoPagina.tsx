import type { ReactNode } from 'react';

// Encabezado de página: bloque negro con ante-título discreto,
// titular en serif display y descripción. Acciones opcionales a la derecha.
export function EncabezadoPagina({
  kicker,
  titulo,
  descripcion,
  acciones,
}: {
  kicker: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="bg-[#141414] text-white p-5 sm:p-6 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="grid gap-1.5">
        <p className="text-xs font-medium tracking-wide text-[#86efac]">{kicker}</p>
        <h2 className="font-display text-2xl sm:text-3xl font-medium leading-tight">{titulo}</h2>
        {descripcion && <p className="text-sm text-white/65 max-w-2xl">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
