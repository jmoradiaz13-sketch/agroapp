import type { ReactNode } from 'react';

// Encabezado de página: bloque corteza sobrio con ante-título discreto,
// titular display y descripción. Acciones opcionales a la derecha.
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
    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center" style={{ background: 'var(--marca)', color: 'var(--marca-texto)', boxShadow: 'var(--sombra-suave)' }}>
      {imagen && (
        <>
          <img src={imagen} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-65" />
          <span className="absolute inset-0 bg-black/40" aria-hidden="true" />
        </>
      )}
      <div className="relative grid gap-1.5">
        <p className="text-xs font-bold tracking-[0.12em]" style={{ color: 'var(--tierra)' }}>{kicker}</p>
        <h2 className="font-display text-2xl sm:text-3xl font-medium leading-tight">{titulo}</h2>
        {descripcion && <p className="text-sm max-w-2xl" style={{ color: 'var(--marca-muted)' }}>{descripcion}</p>}
      </div>
      {acciones && <div className="relative flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
