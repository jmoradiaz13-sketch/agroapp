import { NavLink } from 'react-router-dom';

// Sección única Suelos: Registrar | Historial | Diagnosticar.
// Mantiene las rutas actuales (/ficha, /diagnostico) para no romper
// enlaces ni caché offline; añade /suelo-historial como ruta fina.
const TABS = [
  { ruta: '/ficha', titulo: 'Registrar' },
  { ruta: '/suelo-historial', titulo: 'Historial' },
  { ruta: '/diagnostico', titulo: 'Diagnosticar' },
];

export function TabsSuelos() {
  return (
    <nav aria-label="Secciones de suelos" className="flex gap-1.5 overflow-x-auto scroll-sutil">
      {TABS.map((t) => (
        <NavLink
          key={t.ruta}
          to={t.ruta}
          className="boton-campo shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold transition-colors min-h-[44px] inline-flex items-center"
          style={({ isActive }) => (isActive
            ? { background: 'var(--marca)', color: 'var(--marca-texto)' }
            : { background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' })}
        >
          {t.titulo}
        </NavLink>
      ))}
    </nav>
  );
}
