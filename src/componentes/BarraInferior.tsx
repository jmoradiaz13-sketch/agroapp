import { NavLink, useLocation } from 'react-router-dom';
import { TABS_MOVIL } from '../datos/navegacion';
import { Icono } from './Iconos';

// Bottom tabs móvil a juego con la lateral tierra: panel crema, iconos de línea,
// activo en corteza con pastilla blanca.
export function BarraInferior() {
  const ubicacion = useLocation();
  void ubicacion;
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-4 rounded-t-3xl"
      style={{ background: 'var(--panel)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--borde)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación de campo"
    >
      {TABS_MOVIL.map((t) => (
        <NavLink
          key={t.id}
          to={t.ruta}
          className="boton-campo flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors"
          style={({ isActive }) => ({ color: isActive ? 'var(--texto)' : 'var(--faint)' })}
        >
          {({ isActive }) => (
            <>
              <span
                className="rounded-xl px-4 py-1 grid place-items-center"
                style={isActive ? { background: 'var(--sup)', boxShadow: 'var(--sombra-suave)', border: '1px solid var(--borde-suave)' } : undefined}
              >
                <Icono id={t.icono} />
              </span>
              {t.titulo}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
