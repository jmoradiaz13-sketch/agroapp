import { Link, useSearchParams } from 'react-router-dom';

// Sección única Suelos: Ficha (captura) y Lectura (diagnóstico + historial).
const TABS = [
  { vista: 'ficha', titulo: 'Ficha' },
  { vista: 'lectura', titulo: 'Lectura' },
] as const;

export function TabsSuelos() {
  const [params] = useSearchParams();
  const vista = params.get('vista') === 'lectura' ? 'lectura' : 'ficha';

  return (
    <nav aria-label="Vistas de suelos" className="flex gap-1.5 overflow-x-auto scroll-sutil">
      {TABS.map((t) => {
        const activa = t.vista === vista;
        return (
          <Link
            key={t.vista}
            to={`/suelos?vista=${t.vista}`}
            aria-current={activa ? 'page' : undefined}
            className="boton-campo shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold transition-colors min-h-[44px] inline-flex items-center"
            style={activa
              ? { background: 'var(--marca)', color: 'var(--marca-texto)' }
              : { background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
          >
            {t.titulo}
          </Link>
        );
      })}
    </nav>
  );
}
