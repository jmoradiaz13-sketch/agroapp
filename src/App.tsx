import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { PaginaIngreso } from './paginas/Ingreso';
import { PaginaPredios } from './paginas/Predios';
import { PaginaTablero } from './paginas/Tablero';
import { PaginaDiseno } from './paginas/Diseno';
import { LogoMarca } from './componentes/ui/Logo';
import { BarraSuperior } from './componentes/BarraSuperior';
import { BarraInferior } from './componentes/BarraInferior';
import { BannerOffline } from './componentes/BannerOffline';
import { MarcoEscena } from './componentes/escenario/MarcoEscena';
import { leerTemaOscuro, aplicarTema } from './componentes/InterruptorTema';
import { iniciarSincronizacionAutomatica } from './servicios/sincronizacion';
import { migrarFichasSueloAntiguas } from './servicios/migraciones';
import { usoFlujo, type Paso } from './estado/usoFlujo';
import { usoPredio } from './estado/usoPredio';
import { etiquetaCache } from './base_datos/local';

const DashboardLote = lazy(() => import('./paginas/DashboardLote').then((m) => ({ default: m.DashboardLote })));
const PaginaSuelos = lazy(() => import('./paginas/Suelos').then((m) => ({ default: m.PaginaSuelos })));
const InformePredio = lazy(() => import('./paginas/InformePredio').then((m) => ({ default: m.InformePredio })));
const SigRestauracion = lazy(() => import('./paginas/SigRestauracion').then((m) => ({ default: m.SigRestauracion })));
const Simulador = lazy(() => import('./paginas/Simulador').then((m) => ({ default: m.Simulador })));
const Biblioteca = lazy(() => import('./paginas/Biblioteca').then((m) => ({ default: m.Biblioteca })));

export default function App() {
  const ubicacion = useLocation();
  const { fechaCache } = usoPredio();

  useEffect(() => { void migrarFichasSueloAntiguas().catch(() => undefined); }, []);
  useEffect(() => iniciarSincronizacionAutomatica(), []);
  useEffect(() => {
    aplicarTema(leerTemaOscuro());
  }, []);
  useEffect(() => {
    const mapa: Record<string, Paso> = {
      '/predios': 'predios', '/lote': 'lote', '/suelos': 'ficha', '/sig': 'sig', '/simulador': 'simulador',
      '/diseno': 'diseno', '/informe': 'informe'
    };
    const paso = ubicacion.pathname === '/suelos' && ubicacion.search.includes('vista=lectura')
      ? 'diagnostico'
      : mapa[ubicacion.pathname];
    if (paso) usoFlujo.getState().irPaso(paso);
  }, [ubicacion.pathname, ubicacion.search]);

  return (
    <div className="min-h-screen flex flex-col">
      <BarraSuperior />
      <div className="flex-1 min-w-0 flex flex-col">
        <BannerOffline />
        <main className="flex-1 w-full px-4 py-4 grid gap-4 content-start overflow-x-hidden pb-24 lg:pb-6">
            <Suspense fallback={<p className="font-medium inline-flex items-center gap-2" style={{ color: 'var(--acento)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 giro-lento" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" strokeLinecap="round" /></svg> Cargando escena…</p>}>
            <Routes>
              <Route path="/" element={<PaginaTablero />} />
              <Route path="/predios" element={<MarcoEscena><PaginaPredios /></MarcoEscena>} />
              <Route path="/diseno" element={<MarcoEscena><PaginaDiseno /></MarcoEscena>} />
              <Route path="/lote" element={<MarcoEscena><DashboardLote /></MarcoEscena>} />
              <Route path="/suelos" element={<MarcoEscena><PaginaSuelos /></MarcoEscena>} />
              <Route path="/ficha" element={<Navigate to="/suelos?vista=ficha" replace />} />
              <Route path="/suelo-historial" element={<Navigate to="/suelos?vista=lectura" replace />} />
              <Route path="/diagnostico" element={<Navigate to="/suelos?vista=lectura" replace />} />
              <Route path="/sig" element={<MarcoEscena><SigRestauracion /></MarcoEscena>} />
              <Route path="/simulador" element={<MarcoEscena><Simulador /></MarcoEscena>} />
              <Route path="/biblioteca" element={<MarcoEscena><Biblioteca /></MarcoEscena>} />
              <Route path="/informe" element={<MarcoEscena><InformePredio /></MarcoEscena>} />
              <Route path="/ingreso" element={<PaginaIngreso />} />
            </Routes>
          </Suspense>
        </main>
          <footer className="mt-6" style={{ background: 'var(--marca)', color: 'var(--marca-muted)', borderTop: '3px solid #F28C18' }}>
            <div className="w-full px-4 sm:px-6 xl:px-10 py-8 grid gap-6 md:grid-cols-3">
              <div className="grid content-start gap-2">
                <p className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--marca-texto)' }}>
                  <span className="w-12 h-9 overflow-hidden inline-block shrink-0" aria-hidden><LogoMarca reverso className="w-12 h-9" /></span> <span className="font-display text-lg">SURCAF</span>
                </p>
                <p className="text-xs leading-relaxed">
                  Gestión de fincas y suelos con enfoque agroecológico. Suelos vivos, campo productivo.
                </p>
              </div>
              <nav className="grid content-start gap-1" aria-label="Otras secciones">
                <p className="kicker mb-1" style={{ color: 'var(--marca-texto)' }}>Otras secciones</p>
                <Link to="/suelos" className="text-xs transition-colors">Suelos · ficha y lectura</Link>
                <Link to="/sig" className="text-xs transition-colors">SIG restauración ecológica</Link>
                <Link to="/suelos?vista=lectura" className="text-xs transition-colors">Lectura y diagnóstico del suelo</Link>
                <Link to="/informe" className="text-xs transition-colors">Informe del predio</Link>
                <Link to="/diseno" className="text-xs transition-colors">Diseño de agroecosistemas</Link>
                <Link to="/simulador" className="text-xs transition-colors">Simulador de sistemas</Link>
              </nav>
              <div className="grid content-start gap-1" aria-label="Información">
                <p className="kicker mb-1" style={{ color: 'var(--marca-texto)' }}>Información</p>
                <Link to="/ingreso" className="text-xs transition-colors">Ingreso técnico</Link>
                <Link to="/biblioteca" className="text-xs transition-colors">Biblioteca · aprende en campo</Link>
                <p className="text-xs opacity-70">MAGNA-SIRGAS EPSG:4686 • WGS84 en campo</p>
                <p className="text-xs opacity-70">Caché máx 200 MB por predio • Modo offline</p>
                <p className="text-xs opacity-70 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--acento)' }} aria-hidden />
                  {fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'}
                </p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--borde)' }}>
              <div className="w-full px-4 sm:px-6 xl:px-10 py-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium opacity-70">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-4 rounded overflow-hidden inline-block shrink-0" aria-hidden><LogoMarca reverso className="w-5 h-4" /></span> SURCAF • Gestión de fincas y suelos
                </span>
                <span>Caché local • Sincroniza en oficina</span>
              </div>
            </div>
          </footer>
      </div>
      <BarraInferior />
    </div>
  );
}
