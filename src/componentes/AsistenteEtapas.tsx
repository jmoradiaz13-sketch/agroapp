import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { calcularEtapas, type Etapa } from '../servicios/flujo_etapas';

// Guía lineal de 7 etapas (Plan Maestro §4) sobre las rutas actuales:
// muestra avance real por predio y navega a la etapa que toque.
export function AsistenteEtapas() {
  const navegar = useNavigate();
  const { predioIdentificador } = usoFlujo();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void calcularEtapas(predioIdentificador).then((r) => {
      setEtapas(r.etapas);
      setTotal(r.total);
    });
  }, [predioIdentificador]);

  const actual = etapas.find((e) => e.avance < 100)?.id ?? 7;

  return (
    <section className="bg-selva border border-emerald-500/20 rounded-sm p-4 sm:p-5 grid gap-3" aria-label="Asistente de 7 etapas">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-white">Ruta del predio · 7 etapas</h2>
        <span className="text-xs font-semibold text-emerald-300">{total} % planificado</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={total} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de la ruta">
            <div className="h-full transition-all duration-500" style={{ width: `${total}%`, background: 'var(--acento)' }} />
      </div>
      <ol className="scroll-sutil flex flex-nowrap gap-2 overflow-x-auto pb-1">
        {etapas.map((e) => (
          <li key={e.id} className="shrink-0 w-36">
            <button
              type="button"
              onClick={() => navegar(e.ruta)}
              aria-current={e.id === actual ? 'step' : undefined}
              className={`boton-campo w-full p-3 rounded-sm border text-left transition-all ${
                e.avance === 100
                  ? 'bg-emerald-500/15 border-emerald-400/50 hover:bg-emerald-500/25'
                  : e.id === actual
                    ? 'bg-white/10 border-white/40 hover:bg-white/15'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span
                  className={`w-5 h-5 rounded-full grid place-items-center text-[10px] shrink-0 ${
                    e.avance === 100 ? 'bg-emerald-500 text-slate-950' : e.id === actual ? 'bg-white/20 text-white animate-pulse' : 'bg-white/10 text-white/50'
                  }`}
                  aria-hidden
                >
                  {e.avance === 100 ? '✓' : e.id}
                </span>
                {e.titulo}
              </span>
              <span className="block text-[11px] text-white/55 mt-1 leading-snug">{e.detalle}</span>
            </button>
          </li>
        ))}
      </ol>
      {!predioIdentificador && (
        <p className="text-xs text-white/55">Elige un predio para medir su ruta. <button type="button" onClick={() => navegar('/predios')} className="underline underline-offset-2 text-emerald-300">Ir a predios →</button></p>
      )}
    </section>
  );
}
