import { NavLink, useLocation } from 'react-router-dom';
import { TABS_MOVIL } from '../datos/navegacion';

// Bottom tabs móvil (ref_2): 4 destinos campo. Solo <lg; en PC manda el sidebar.
// Con padding seguro para gestos del sistema.
export function BarraInferior() {
  const ubicacion = useLocation();
  void ubicacion;
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-selva-profundo/92 backdrop-blur border-t border-emerald-500/20 grid grid-cols-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación de campo"
    >
      {TABS_MOVIL.map((t) => (
        <NavLink
          key={t.id}
          to={t.ruta}
          className={({ isActive }) => `boton-campo flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
            isActive ? 'text-emerald-300' : 'text-white/55 hover:text-white'
          }`}
        >
          <span className="text-xl leading-none" aria-hidden>{t.icono}</span>
          {t.titulo}
        </NavLink>
      ))}
    </nav>
  );
}
