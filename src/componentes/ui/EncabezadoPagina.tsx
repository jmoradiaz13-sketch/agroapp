import type { ReactNode } from 'react';

// Encabezado de página: bloque negro con ante-título discreto,
// titular en serif display y descripción. Acciones opcionales a la derecha.
// Con `imagen`, muestra la foto en velo (oscurecida) como fondo.
export function EncabezadoPagina({
  kicker,
  titulo,
  descripcion,
  acciones,
  imagen,
}: {
  kicker: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  imagen?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-selva text-white p-5 sm:p-6 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center border-b-2 border-emerald-500/40">
      {imagen && (
        <>
          <img src={imagen} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-65" />
          <span className="absolute inset-0 bg-black/40" aria-hidden="true" />
        </>
      )}
      <div className="relative grid gap-1.5">
        <p className="text-xs font-medium tracking-wide text-emerald-300">{kicker}</p>
        <h2 className="font-display text-2xl sm:text-3xl font-medium leading-tight">{titulo}</h2>
        {descripcion && <p className="text-sm text-white/65 max-w-2xl">{descripcion}</p>}
      </div>
      {acciones && <div className="relative flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
