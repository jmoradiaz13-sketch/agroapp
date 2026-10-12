import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ESCENA_POR_RUTA } from '../../datos/escenas';

// Marco de escena: cada opción del menú abre su ventana dentro de la misma
// plataforma (hero con imagen, migas ← Tablero, insignia de conectividad).
// Rutas sin escena (/, /ingreso) pasan intactas.
export function MarcoEscena({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const escena = ESCENA_POR_RUTA[pathname];
  if (!escena) return <>{children}</>;

  return (
    <div className="grid gap-4 animacion-entrada" key={pathname}>
      <section className="relative overflow-hidden" style={{ background: 'var(--marca)' }} aria-label={escena.titulo}>
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: escena.color }} aria-hidden />
        <div className="relative p-5 sm:p-6 grid gap-1.5 content-end">
          <p className="flex flex-wrap items-center gap-2">
            <Link to="/" className="boton-campo text-[11px] font-bold tracking-widest rounded-full px-3 py-1 transition-colors" style={{ background: 'rgba(245,238,225,0.14)', color: '#F5EEE1', border: '1px solid rgba(245,238,225,0.35)' }}>
              ← Tablero
            </Link>
            <span className="kicker" style={{ color: escena.color === '#F6B23D' || escena.color === '#F28C18' ? escena.color : 'var(--ocre)' }}>{escena.etapa}</span>
            <span className="mono-micro px-2 py-0.5" style={{ background: escena.color, color: escena.sobre }}>
              {escena.insignia}
            </span>
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight" style={{ color: '#F5EEE1' }}>{escena.titulo}</h1>
          <p className="text-sm max-w-2xl" style={{ color: 'rgba(245,238,225,0.75)' }}>{escena.descripcion}</p>
        </div>
      </section>
      {children}
    </div>
  );
}
