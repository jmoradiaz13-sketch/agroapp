import { Link, useLocation } from 'react-router-dom';
import { GRUPOS_NAV, grupoDeRuta } from '../datos/navegacion';
import { Icono } from './Iconos';

// Bottom tabs móvil: los tres frentes de operación del sitio.
export function BarraInferior() {
  const ubicacion = useLocation();
  const activoId = grupoDeRuta(ubicacion.pathname)?.id ?? null;
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-3 rounded-t-3xl"
      style={{ background: 'var(--panel)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--borde)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación de campo"
    >
      {GRUPOS_NAV.map((g) => {
        const activo = activoId === g.id;
        return (
          <Link
            key={g.id}
            to={g.ruta}
            className="boton-campo flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors"
            style={{ color: activo ? 'var(--texto)' : 'var(--faint)' }}
          >
            <span
              className="rounded-xl px-4 py-1 grid place-items-center"
              style={activo ? { background: 'var(--sup)', boxShadow: 'var(--sombra-suave)', border: '1px solid var(--borde-suave)' } : undefined}
            >
              <Icono id={g.icono} />
            </span>
            {g.corto}
          </Link>
        );
      })}
    </nav>
  );
}
