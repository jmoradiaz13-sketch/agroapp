import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { PaginaIngreso } from './paginas/Ingreso';
import { PaginaPredios } from './paginas/Predios';
import { PaginaInicio } from './paginas/Inicio';
import { PaginaDiseno } from './paginas/Diseno';
import { LogoArbolA } from './componentes/ui/Logo';
import { BarraLateral } from './componentes/BarraLateral';
import { BarraInferior } from './componentes/BarraInferior';
import { BannerOffline } from './componentes/BannerOffline';
import { InterruptorTema, leerTemaClaro, aplicarTema } from './componentes/InterruptorTema';
import { MENU_VERDE, MENU_NEGRO } from './datos/navegacion';
import { iniciarSincronizacionAutomatica } from './servicios/sincronizacion';
import { usoFlujo, type Paso } from './estado/usoFlujo';
import { usoPredio } from './estado/usoPredio';
import { etiquetaCache } from './base_datos/local';

const DashboardLote = lazy(() => import('./paginas/DashboardLote').then((m) => ({ default: m.DashboardLote })));
const FichaLote = lazy(() => import('./paginas/FichaLote').then((m) => ({ default: m.FichaLote })));
const DiagnosticoLote = lazy(() => import('./paginas/DiagnosticoLote').then((m) => ({ default: m.DiagnosticoLote })));
const InformePredio = lazy(() => import('./paginas/InformePredio').then((m) => ({ default: m.InformePredio })));
const SigRestauracion = lazy(() => import('./paginas/SigRestauracion').then((m) => ({ default: m.SigRestauracion })));
const Simulador = lazy(() => import('./paginas/Simulador').then((m) => ({ default: m.Simulador })));
const Biblioteca = lazy(() => import('./paginas/Biblioteca').then((m) => ({ default: m.Biblioteca })));

// Header móvil compacto (en PC lo reemplaza el sidebar + topbar delgada).
function BarraSuperior() {
  const [abierto, setAbierto] = useState(false);
  const ubicacion = useLocation();

  useEffect(() => setAbierto(false), [ubicacion.pathname]);

  return (
    <header className="lg:hidden sticky top-0 z-50 shadow-campo">
      <div className="bg-selva border-b border-emerald-500/30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 sm:gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0" aria-label="AgroForestapp inicio">
            <span className="w-10 h-10 rounded-xl bg-white grid place-items-center shadow shrink-0" aria-hidden>
              <LogoArbolA className="w-7 h-7 text-emerald-600" />
            </span>
            <span className="leading-none grid min-w-0">
              <span className="text-sm font-bold tracking-tight text-white">AGROFORESTAPP</span>
              <span className="text-[10px] font-medium tracking-wide text-white/60">Gestión de fincas y suelos</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <InterruptorTema />
            <NavLink to="/ingreso" className="boton-campo inline-flex items-center gap-1.5 bg-white text-slate-900 rounded px-3 py-1 text-[12px] font-semibold hover:bg-emerald-100 transition-colors" aria-label="Ingreso">
              <span aria-hidden>👤</span>
            </NavLink>
            <button
              className="boton-campo w-11 h-11 grid place-items-center text-2xl font-semibold text-white px-2 shrink-0"
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
              <NavLink key={m.id} to={m.ruta} className={({ isActive }) => `boton-campo rounded px-3 py-2 text-xs font-semibold text-center transition-colors ${isActive ? 'bg-emerald-400 text-slate-950' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                {m.icono} {m.titulo}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {/* Fila de herramientas por conectividad con scroll horizontal */}
      <div className="bg-selva-profundo text-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center gap-2 overflow-x-auto scroll-sutil">
          <nav className="flex items-center gap-4 sm:gap-5 text-[12px] font-medium text-white/85 overflow-x-auto scroll-sutil w-full" aria-label="Herramientas por conectividad">
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
                  <span className="text-[9px] font-semibold tracking-widest text-emerald-300/80">{m.insignia}</span>
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
    aplicarTema(leerTemaClaro());
  }, []);
  useEffect(() => {
    const mapa: Record<string, Paso> = {
      '/predios': 'predios', '/lote': 'lote', '/ficha': 'ficha', '/sig': 'sig', '/simulador': 'simulador',
      '/diseno': 'diseno', '/diagnostico': 'diagnostico', '/informe': 'informe'
    };
    if (mapa[ubicacion.pathname]) usoFlujo.getState().irPaso(mapa[ubicacion.pathname]);
  }, [ubicacion.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <BarraSuperior />
      <div className="flex flex-1 items-stretch">
        <BarraLateral />
        <div className="flex-1 min-w-0 flex flex-col">
          <BannerOffline />
          <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 grid gap-4 content-start overflow-x-hidden pb-24 lg:pb-4">
            <Suspense fallback={<p className="font-medium text-emerald-700">🌱 Cargando paso…</p>}>
              <Routes>
                <Route path="/" element={<PaginaInicio />} />
                <Route path="/predios" element={<PaginaPredios />} />
                <Route path="/diseno" element={<PaginaDiseno />} />
                <Route path="/lote" element={<DashboardLote />} />
                <Route path="/ficha" element={<FichaLote />} />
                <Route path="/sig" element={<SigRestauracion />} />
                <Route path="/simulador" element={<Simulador />} />
                <Route path="/biblioteca" element={<Biblioteca />} />
                <Route path="/diagnostico" element={<DiagnosticoLote />} />
                <Route path="/informe" element={<InformePredio />} />
                <Route path="/ingreso" element={<PaginaIngreso />} />
              </Routes>
            </Suspense>
          </main>
          <footer className="mt-6 bg-selva-profundo text-white/80 border-t border-emerald-500/20">
            <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-3">
              <div className="grid content-start gap-2">
                <p className="text-base font-semibold text-white flex items-center gap-2">
                  <LogoArbolA className="w-8 h-8 text-emerald-400" /> AGROFORESTAPP
                </p>
                <p className="text-xs leading-relaxed text-white/60">
                  Gestión de fincas y suelos con enfoque agroecológico. Suelos vivos, campo productivo.
                </p>
              </div>
              <nav className="grid content-start gap-1" aria-label="Otras secciones">
                <p className="text-xs font-semibold tracking-wide text-white/90 mb-1">Otras secciones</p>
                <Link to="/ficha" className="text-xs text-white/60 hover:text-emerald-300 transition-colors">Análisis de suelos VSA</Link>
                <Link to="/sig" className="text-xs text-white/60 hover:text-emerald-300 transition-colors">SIG restauración ecológica</Link>
                <Link to="/diagnostico" className="text-xs text-white/60 hover:text-emerald-300 transition-colors">Diagnóstico agroecológico</Link>
                <Link to="/informe" className="text-xs text-white/60 hover:text-emerald-300 transition-colors">Informe del predio</Link>
                <Link to="/diseno" className="text-xs text-white/60 hover:text-emerald-300 transition-colors">Diseño de agroecosistemas</Link>
                <Link to="/simulador" className="text-xs text-white/60 hover:text-emerald-300 transition-colors">Simulador de sistemas</Link>
              </nav>
              <div className="grid content-start gap-1" aria-label="Información">
                <p className="text-xs font-semibold tracking-wide text-white/90 mb-1">Información</p>
                <Link to="/ingreso" className="text-xs text-white/60 hover:text-emerald-300 transition-colors">Ingreso técnico</Link>
                <Link to="/biblioteca" className="text-xs text-white/60 hover:text-emerald-300 transition-colors">Biblioteca · aprende en campo</Link>
                <p className="text-xs text-white/40">MAGNA-SIRGAS EPSG:4686 • WGS84 en campo</p>
                <p className="text-xs text-white/40">Caché máx 200 MB por predio • Modo offline</p>
                <p className="text-xs text-white/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
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
      </div>
      <BarraInferior />
    </div>
  );
}
