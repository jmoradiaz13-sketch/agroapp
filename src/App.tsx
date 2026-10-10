import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { PaginaIngreso } from './paginas/Ingreso';
import { PaginaPredios } from './paginas/Predios';
import { PaginaInicio } from './paginas/Inicio';
import { PaginaDiseno } from './paginas/Diseno';
import { LogoArbolA } from './componentes/ui/Logo';
import { iniciarSincronizacionAutomatica } from './servicios/sincronizacion';
import { usoFlujo, type Paso } from './estado/usoFlujo';
import { usoPredio } from './estado/usoPredio';
import { etiquetaCache } from './base_datos/local';

const DashboardLote = lazy(() => import('./paginas/DashboardLote').then((m) => ({ default: m.DashboardLote })));
const FichaLote = lazy(() => import('./paginas/FichaLote').then((m) => ({ default: m.FichaLote })));
const DiagnosticoLote = lazy(() => import('./paginas/DiagnosticoLote').then((m) => ({ default: m.DiagnosticoLote })));
const InformePredio = lazy(() => import('./paginas/InformePredio').then((m) => ({ default: m.InformePredio })));

const MENU_VERDE: { id: string; ruta: string; titulo: string }[] = [
  { id: 'inicio', ruta: '/', titulo: 'Inicio' },
  { id: 'predios', ruta: '/predios', titulo: 'Predios' },
  { id: 'lote', ruta: '/lote', titulo: 'Lotes' },
  { id: 'ficha', ruta: '/ficha', titulo: 'Análisis de suelos' },
  { id: 'diseno', ruta: '/diseno', titulo: 'Diseño' },
  { id: 'diagnostico', ruta: '/diagnostico', titulo: 'Diagnóstico' },
  { id: 'informe', ruta: '/informe', titulo: 'Informe' },
];

// Fila negra: herramientas reales con insignia de conectividad (AGENTS §4)
// + funciones futuras marcadas PRÓXIMO (no enlazan a rutas inexistentes).
const MENU_NEGRO: { titulo: string; ruta?: string; insignia: string; proximo?: boolean }[] = [
  { titulo: 'Mapa GPS', ruta: '/lote', insignia: 'OFFLINE' },
  { titulo: 'Análisis VSA', ruta: '/ficha', insignia: 'OFFLINE' },
  { titulo: 'Análisis lab', ruta: '/ficha', insignia: 'OFFLINE' },
  { titulo: 'Monitoreo', ruta: '/lote', insignia: 'OFFLINE' },
  { titulo: 'Pendiente / RUSLE', insignia: 'MIXTO', proximo: true },
  { titulo: 'Capas IGAC', insignia: 'MIXTO', proximo: true },
  { titulo: 'NDVI satelital', insignia: 'ONLINE', proximo: true },
];

function BarraSuperior() {
  const [abierto, setAbierto] = useState(false);
  const ubicacion = useLocation();

  useEffect(() => setAbierto(false), [ubicacion.pathname]);

  return (
    <header className="sticky top-0 z-50 shadow-campo">
      {/* Fila 1 verde oscuro sólido estilo referencia interfaz.png */}
      <div className="bg-[#1b5e20]">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="AgroForestapp inicio">
            <span className="w-14 h-14 rounded-xl bg-white grid place-items-center shadow" aria-hidden>
              <LogoArbolA className="w-10 h-10 text-[#1b5e20]" />
            </span>
            <span className="leading-none grid">
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">AGROFORESTAPP</span>
              <span className="text-[11px] font-medium tracking-wide text-white/60">Gestión de fincas y suelos</span>
            </span>
          </Link>
          <nav className="hidden xl:flex items-center gap-4 text-[13px] font-medium text-white/90" aria-label="Secciones">
            {MENU_VERDE.slice(1).map((m) => (
              <NavLink key={m.id} to={m.ruta} className="px-2 py-1 rounded-sm hover:bg-white/15 hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] transition-all">
                {m.titulo}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2 text-[12px] font-medium text-white">
            <span className="border border-white/40 rounded px-1.5 py-0.5">ES-CO</span>
            <NavLink to="/ingreso" className="boton-campo inline-flex items-center gap-1.5 bg-white text-[#1b5e20] rounded px-3 py-1 text-[12px] font-semibold hover:bg-green-100 transition-colors">
              <span aria-hidden>👤</span> Ingreso
            </NavLink>
            <button
              className="xl:hidden boton-campo text-2xl font-semibold px-2 text-white"
              onClick={() => setAbierto((v) => !v)}
              aria-label="Abrir menú"
              aria-expanded={abierto}
            >
              {abierto ? '✕' : '☰'}
            </button>
          </div>
          <button
            className="md:hidden boton-campo text-2xl font-semibold text-white px-2"
            onClick={() => setAbierto((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={abierto}
          >
            {abierto ? '✕' : '☰'}
          </button>
        </div>
        {abierto && (
          <nav className="xl:hidden px-4 pb-3 grid grid-cols-2 gap-1.5 animacion-entrada" aria-label="Menú móvil">
            {MENU_VERDE.map((m) => (
              <NavLink key={m.id} to={m.ruta} className="boton-campo bg-white/15 text-white rounded px-3 py-2 text-xs font-semibold text-center">
                {m.titulo}
              </NavLink>
            ))}
            <NavLink to="/ingreso" className="boton-campo bg-white text-[#1b5e20] rounded px-3 py-2 text-xs font-semibold text-center">
              Ingreso
            </NavLink>
          </nav>
        )}
      </div>

      {/* Fila 2 negra: herramientas por conectividad */}
      <div className="bg-[#141414] text-white">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2">
          <nav className="hidden lg:flex items-center gap-5 text-[12px] font-medium text-white/85 overflow-x-auto" aria-label="Herramientas por conectividad">
            {MENU_NEGRO.map((m) => (
              m.proximo ? (
                <span
                  key={m.titulo}
                  title={`${m.titulo}: requiere ${m.insignia.toLowerCase()} — disponible próximamente`}
                  className="py-2.5 whitespace-nowrap text-white/35 cursor-not-allowed flex items-center gap-1.5"
                >
                  {m.titulo}
                  <span className="text-[9px] font-semibold tracking-widest bg-white/10 text-white/50 rounded-sm px-1.5 py-0.5">PRÓXIMO · {m.insignia}</span>
                </span>
              ) : (
                <Link key={m.titulo} to={m.ruta!} className="py-2.5 px-2 rounded-sm hover:bg-white/10 hover:text-white hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.14)] whitespace-nowrap transition-all flex items-center gap-1.5">
                  {m.titulo}
                  <span className="text-[9px] font-semibold tracking-widest text-[#86efac]/70">{m.insignia}</span>
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const ubicacion = useLocation();
  const { fechaCache } = usoPredio();

  useEffect(() => iniciarSincronizacionAutomatica(), []);
  useEffect(() => {
    const mapa: Record<string, Paso> = {
      '/predios': 'predios', '/lote': 'lote', '/ficha': 'ficha',
      '/diagnostico': 'diagnostico', '/informe': 'informe'
    };
    if (mapa[ubicacion.pathname]) usoFlujo.getState().irPaso(mapa[ubicacion.pathname]);
  }, [ubicacion.pathname]);

  const esInicio = ubicacion.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <BarraSuperior />
      <main className={`flex-1 w-full ${esInicio ? 'max-w-6xl' : 'max-w-4xl'} mx-auto p-4 grid gap-4 content-start`}>
        <Suspense fallback={<p className="font-medium text-[#1b5e20]">🌱 Cargando paso…</p>}>
          <Routes>
            <Route path="/" element={<PaginaInicio />} />
            <Route path="/predios" element={<PaginaPredios />} />
            <Route path="/diseno" element={<PaginaDiseno />} />
            <Route path="/lote" element={<DashboardLote />} />
            <Route path="/ficha" element={<FichaLote />} />
            <Route path="/diagnostico" element={<DiagnosticoLote />} />
            <Route path="/informe" element={<InformePredio />} />
            <Route path="/ingreso" element={<PaginaIngreso />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="mt-6 bg-[#141414] text-white/80">
        <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-3">
          <div className="grid content-start gap-2">
            <p className="text-base font-semibold text-white flex items-center gap-2">
              <LogoArbolA className="w-8 h-8 text-[#86efac]" /> AGROFORESTAPP
            </p>
            <p className="text-xs leading-relaxed text-white/60">
              Gestión de fincas y suelos con enfoque agroecológico. Suelos vivos, campo productivo.
            </p>
          </div>
          <nav className="grid content-start gap-1" aria-label="Otras secciones">
            <p className="text-xs font-semibold tracking-wide text-white/90 mb-1">Otras secciones</p>
            <Link to="/ficha" className="text-xs text-white/60 hover:text-[#86efac] transition-colors">Análisis de suelos VSA</Link>
            <Link to="/diagnostico" className="text-xs text-white/60 hover:text-[#86efac] transition-colors">Diagnóstico agroecológico</Link>
            <Link to="/informe" className="text-xs text-white/60 hover:text-[#86efac] transition-colors">Informe del predio</Link>
            <Link to="/diseno" className="text-xs text-white/60 hover:text-[#86efac] transition-colors">Diseño de agroecosistemas</Link>
          </nav>
          <div className="grid content-start gap-1" aria-label="Información">
            <p className="text-xs font-semibold tracking-wide text-white/90 mb-1">Información</p>
            <Link to="/ingreso" className="text-xs text-white/60 hover:text-[#86efac] transition-colors">Ingreso técnico</Link>
            <p className="text-xs text-white/40">MAGNA-SIRGAS EPSG:4686 • WGS84 en campo</p>
            <p className="text-xs text-white/40">Caché máx 200 MB por predio • Modo offline</p>
            <p className="text-xs text-white/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse" aria-hidden />
              {fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'}
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-white/40">
            <span className="flex items-center gap-1.5">
              <LogoArbolA className="w-5 h-5 text-white/40" /> AGROFORESTAPP • Gestión de fincas y suelos
            </span>
            <span>Caché local • Sincroniza en oficina</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
