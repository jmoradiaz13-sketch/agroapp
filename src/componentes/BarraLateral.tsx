import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MENU_VERDE } from '../datos/navegacion';
import { LogoArbolA } from './ui/Logo';
import { InterruptorTema } from './InterruptorTema';
import { usoFlujo } from '../estado/usoFlujo';
import { baseDatos } from '../base_datos/local';

// Sidebar PC (ref_1): logo + predio activo + 10 secciones + estado offline.
// Visible solo en lg+; en móvil lo reemplazan header compacto + bottom tabs.
export function BarraLateral() {
  const { predioIdentificador } = usoFlujo();
  const [nombrePredio, setNombrePredio] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    if (!predioIdentificador) {
      setNombrePredio(null);
      return;
    }
    void baseDatos.predios.where('identificador').equals(predioIdentificador).first()
      .then((p) => setNombrePredio(p?.nombre ?? predioIdentificador));
  }, [predioIdentificador]);

  useEffect(() => {
    const contar = async () => {
      const [fichas, fotos, lotes] = await Promise.all([
        baseDatos.fichasSuelo.filter((f) => !f.sincronizada).count(),
        baseDatos.fotos.filter((f) => !f.sincronizada).count(),
        baseDatos.lotes.filter((l) => (l.estadoSincronizacion ?? 'pendiente') !== 'sincronizado').count(),
      ]);
      setPendientes(fichas + fotos + lotes);
    };
    void contar();
    const id = window.setInterval(() => void contar(), 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen bg-selva-profundo border-r border-emerald-500/15 p-4 gap-4 overflow-y-auto" aria-label="Navegación principal">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 flex-1 min-w-0" aria-label="AgroForestapp inicio">
          <span className="w-10 h-10 rounded-xl bg-white grid place-items-center shadow shrink-0" aria-hidden>
            <LogoArbolA className="w-7 h-7 text-emerald-600" />
          </span>
          <span className="leading-none grid min-w-0">
            <span className="text-sm font-bold tracking-tight text-white">AGROFORESTAPP</span>
            <span className="text-[10px] font-medium tracking-wide text-white/50">Gestión de fincas y suelos</span>
          </span>
        </Link>
        <InterruptorTema />
      </div>

      <div
        role="status"
        className={`rounded-sm px-3 py-2 text-[11px] font-semibold flex items-center gap-1.5 ${
          navigator.onLine ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30' : 'bg-amber-500 text-slate-950'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${navigator.onLine ? 'bg-emerald-400' : 'bg-selva-profundo animate-pulse'}`} aria-hidden />
        {navigator.onLine
          ? (pendientes === 0 ? 'Todo sincronizado ✓' : `${pendientes} pendientes de sync`)
          : `Offline · ${pendientes} pendientes`}
      </div>

      <Link
        to="/predios"
        className="glass rounded-2xl p-3 grid gap-0.5 hover:border-emerald-400/40 transition-colors"
        aria-label="Predio activo"
      >
        <span className="text-[10px] font-bold tracking-widest text-emerald-300/80">PREDIO ACTIVO</span>
        <span className="text-sm font-semibold text-white truncate">{nombrePredio ?? 'Sin elegir'}</span>
        <span className="text-[11px] text-white/50">{nombrePredio ? 'Cambiar →' : 'Elegir predio →'}</span>
      </Link>

      <nav className="grid gap-1" aria-label="Secciones">
        {MENU_VERDE.map((m) => (
          <NavLink
            key={m.id}
            to={m.ruta}
            className={({ isActive }) => `boton-campo flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive ? 'bg-emerald-500/20 text-white shadow-[inset_0_0_12px_rgba(16,185,129,0.15)]' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-base w-6 text-center shrink-0" aria-hidden>{m.icono}</span>
            {m.titulo}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
