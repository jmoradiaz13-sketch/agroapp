import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { GRUPOS_NAV, MENU_VERDE } from '../datos/navegacion';
import { ESCENA_POR_RUTA } from '../datos/escenas';
import { Icono } from './Iconos';
import { LogoMarca } from './ui/Logo';
import { InterruptorTema } from './InterruptorTema';

// Barra superior única: marca protagonista + grupos con panel desplegable.
// Sin pastillas de sync ni ingreso (viven en el Tablero y el pie).
// En móvil, header compacto + menú en cuadrícula.
function grupoActivo(rutas: string[], pathname: string): boolean {
  return rutas.some((r) => (r === '/' ? pathname === '/' : pathname.startsWith(r)));
}

function BarraEscritorio() {
  const { pathname } = useLocation();
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
            const activo = grupoActivo(g.items.map((i) => i.ruta), pathname);
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
                <div className="absolute left-0 top-full pt-2 min-w-[290px]">
                  <div className="rounded-2xl p-2 grid gap-0.5 animacion-entrada" style={{ background: 'var(--sup)', border: '1px solid var(--borde)', boxShadow: '0 16px 40px -16px rgba(46,33,24,0.3)' }}>
                    {g.items.map((m) => (
                      <NavLink
                        key={m.id}
                        to={m.ruta}
                        onClick={() => setAbierto(null)}
                        className="boton-campo item-menu group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                      >
                        <span className="mt-0.5 shrink-0" style={{ color: ESCENA_POR_RUTA[m.ruta]?.color ?? 'var(--acento)' }}><Icono id={m.icono} /></span>
                        <span className="grid gap-0.5 min-w-0 flex-1">
                          <span className="fila-menu text-[13.5px] font-semibold leading-none" style={{ color: 'var(--texto)' }}>{m.titulo}</span>
                          {ESCENA_POR_RUTA[m.ruta] && (
                            <span className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                              {ESCENA_POR_RUTA[m.ruta].descripcion} · {ESCENA_POR_RUTA[m.ruta].insignia}
                            </span>
                          )}
                        </span>
                        <span className="fila-flecha shrink-0" style={{ color: 'var(--texto)' }} aria-hidden>→</span>
                      </NavLink>
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
  useEffect(() => setAbierto(false), [ubicacion.pathname]);
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
              <span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--marca-muted)' }}>Gestión de fincas y suelos</span>
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
          <nav className="px-4 pb-3 grid grid-cols-2 gap-1.5 animacion-entrada" aria-label="Menú móvil">
            {MENU_VERDE.map((m) => (
              <NavLink key={m.id} to={m.ruta} className="boton-campo rounded-2xl px-3 py-2 text-xs font-semibold text-center transition-colors inline-flex items-center justify-center gap-1.5" style={({ isActive }) => (isActive ? { background: 'var(--marca-texto)', color: 'var(--marca)' } : { background: 'transparent', color: 'var(--marca-muted)', border: '1px solid var(--borde)' })}>
                <Icono id={m.icono} /> {m.titulo}
              </NavLink>
            ))}
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
