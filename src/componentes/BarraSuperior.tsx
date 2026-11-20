import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GRUPOS_NAV, grupoDeRuta, type ItemNav } from '../datos/navegacion';
import { COLOR_POR_GRUPO } from '../datos/escenas';
import { Icono } from './Iconos';
import { LogoMarca } from './ui/Logo';
import { InterruptorTema } from './InterruptorTema';

// Barra superior única: marca protagonista + tres frentes con panel
// desplegable de submenús agrupados por categoría.
// En móvil, header compacto + menú en cuadrícula con los mismos submenús.
function categoriasDe(items: ItemNav[]): { nombre: string; items: ItemNav[] }[] {
  return items.reduce<{ nombre: string; items: ItemNav[] }[]>((acc, item) => {
    const ultima = acc[acc.length - 1];
    if (ultima && ultima.nombre === item.categoria) ultima.items.push(item);
    else acc.push({ nombre: item.categoria, items: [item] });
    return acc;
  }, []);
}

function BarraEscritorio() {
  const { pathname } = useLocation();
  const activoId = grupoDeRuta(pathname)?.id ?? null;
  // Auto-ocultado: se cierra al elegir opción, con Escape o al salir del grupo.
  const [abierto, setAbierto] = useState<string | null>(null);
  const temporizador = useRef<number | null>(null);
  const limpiarTemporizador = () => {
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  };
  useEffect(() => limpiarTemporizador, []);
  useEffect(() => {
    const alTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        limpiarTemporizador();
        setAbierto(null);
      }
    };
    window.addEventListener('keydown', alTeclar);
    return () => window.removeEventListener('keydown', alTeclar);
  }, []);
  const entrarGrupo = (id: string) => {
    limpiarTemporizador();
    setAbierto(id);
  };
  const salirGrupo = () => {
    limpiarTemporizador();
    temporizador.current = window.setTimeout(() => setAbierto(null), 150);
  };
  return (
    <div className="hidden lg:block sticky top-0 z-50" style={{ background: 'var(--marca)', borderBottom: '1px solid var(--borde)' }}>
      <div className="w-full px-6 xl:px-10 h-20 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="SurcAF inicio">
          <span className="w-16 h-11 grid place-items-center shrink-0" aria-hidden>
            <LogoMarca reverso className="w-16 h-11" />
          </span>
          <span className="leading-none grid">
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--marca-texto)' }}>SURCAF</span>
            <span className="mono-micro" style={{ color: 'var(--marca-muted)' }}>fincas y suelos</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Secciones">
          {GRUPOS_NAV.map((g, gi) => {
            const activo = activoId === g.id;
            const color = COLOR_POR_GRUPO[g.id]?.color ?? 'var(--acento)';
            return (
              <div key={g.id} className="relative" onMouseEnter={() => entrarGrupo(g.id)} onMouseLeave={salirGrupo}>
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={abierto === g.id}
                  onClick={() => setAbierto((a) => (a === g.id ? null : g.id))}
                  className="boton-campo inline-flex items-baseline gap-1.5 px-4 py-2 rounded-full text-[13.5px] font-semibold transition-colors"
                  style={activo ? { background: 'var(--marca-texto)', color: 'var(--marca)' } : { color: 'var(--marca-muted)' }}
                >
                  <span className="mono-micro" style={{ color: activo ? 'var(--marca)' : 'var(--marca-muted)', opacity: 0.7 }} aria-hidden>0{gi + 1}</span>
                  {g.titulo}
                  <span aria-hidden className={`text-[10px] transition-transform ${abierto === g.id ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {abierto === g.id && (
                <div className="absolute left-0 top-full pt-2 min-w-[320px]">
                  <div className="rounded-2xl p-2 grid gap-0.5 animacion-entrada" style={{ background: 'var(--sup)', border: '1px solid var(--borde)', boxShadow: '0 16px 40px -16px rgba(46,33,24,0.3)' }}>
                    {categoriasDe(g.items).map((cat, ci) => (
                      <div key={cat.nombre} className="grid gap-0.5">
                        <p className={`mono-micro px-3 pb-1 ${ci === 0 ? 'pt-1' : 'pt-2.5'}`} style={{ color: 'var(--muted)' }}>{cat.nombre}</p>
                        {cat.items.map((m) => (
                          <Link
                            key={m.id}
                            to={m.ruta}
                            onClick={() => setAbierto(null)}
                            className="boton-campo item-menu group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                          >
                            <span className="mt-0.5 shrink-0" style={{ color }}><Icono id={m.icono} /></span>
                            <span className="grid gap-0.5 min-w-0 flex-1">
                              <span className="fila-menu text-[13.5px] font-semibold leading-none" style={{ color: 'var(--texto)' }}>{m.titulo}</span>
                              <span className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>{m.descripcion}</span>
                            </span>
                            <span className="fila-flecha shrink-0" style={{ color: 'var(--texto)' }} aria-hidden>→</span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <InterruptorTema invertido />
        </div>
      </div>
    </div>
  );
}

function BarraMovil() {
  const [abierto, setAbierto] = useState(false);
  const ubicacion = useLocation();
  useEffect(() => setAbierto(false), [ubicacion.pathname, ubicacion.search]);
  useEffect(() => {
    const alTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', alTeclar);
    return () => window.removeEventListener('keydown', alTeclar);
  }, []);
  return (
    <header className="lg:hidden sticky top-0 z-50" style={{ boxShadow: 'var(--sombra-suave)' }}>
      <div style={{ background: 'var(--marca)', borderBottom: '1px solid var(--borde)' }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 sm:gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0" aria-label="SurcAF inicio">
            <span className="w-12 h-9 grid place-items-center shrink-0 overflow-hidden" aria-hidden>
              <LogoMarca reverso className="w-12 h-9" />
            </span>
            <span className="leading-none grid min-w-0">
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--marca-texto)' }}>SURCAF</span>
              <span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--marca-muted)' }}>Fincas · Suelos · SIG</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <InterruptorTema invertido />
            <button
              className="boton-campo w-11 h-11 grid place-items-center text-2xl font-semibold px-2 shrink-0"
              style={{ color: 'var(--marca-texto)' }}
              onClick={() => setAbierto((v) => !v)}
              aria-label="Abrir menú"
              aria-expanded={abierto}
            >
              {abierto ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {abierto && (
          <nav className="px-4 pb-3 grid gap-3 animacion-entrada" aria-label="Menú móvil">
            {GRUPOS_NAV.map((g) => {
              const color = COLOR_POR_GRUPO[g.id]?.color ?? '#F2E9D8';
              return (
                <div key={g.id} className="grid gap-1.5">
                  <Link
                    to={g.ruta}
                    onClick={() => setAbierto(false)}
                    className="boton-campo inline-flex items-center gap-2 px-1 py-1 text-sm font-bold transition-colors"
                    style={{ color: 'var(--marca-texto)' }}
                  >
                    <span style={{ color }}><Icono id={g.icono} /></span>
                    {g.titulo}
                  </Link>
                  <div className="grid grid-cols-2 gap-1.5">
                    {g.items.map((m) => (
                      <Link
                        key={m.id}
                        to={m.ruta}
                        onClick={() => setAbierto(false)}
                        className="boton-campo rounded-2xl px-3 py-2 text-xs font-semibold transition-colors inline-flex items-center justify-center text-center"
                        style={{ background: 'transparent', color: 'var(--marca-muted)', border: '1px solid var(--borde)' }}
                      >
                        {m.titulo}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}

export function BarraSuperior() {
  return (
    <>
      <BarraEscritorio />
      <BarraMovil />
    </>
  );
}
