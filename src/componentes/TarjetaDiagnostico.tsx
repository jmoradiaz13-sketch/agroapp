import { useState } from 'react';
import type { Hallazgo, DecisionTecnico } from '../esquemas/diagnostico';

// El Técnico Decide: sugiere el sistema, decide el técnico. Justifica el porqué.
export function TarjetaDiagnostico({ hallazgo }: { hallazgo: Hallazgo }) {
  const [decision, setDecision] = useState<DecisionTecnico | null>(null);
  const [detalle, setDetalle] = useState(false);
  const semaforo =
    hallazgo.estado === 'optimo'
      ? { borde: 'border-l-green-600', insignia: 'bg-emerald-100 text-emerald-800 border-emerald-300', punto: 'bg-green-600', texto: 'Óptimo' }
      : hallazgo.estado === 'deficiente'
        ? { borde: 'border-l-red-600', insignia: 'bg-red-100 text-red-800 border-red-300', punto: 'bg-red-600', texto: 'Deficiente' }
        : { borde: 'border-l-yellow-500', insignia: 'bg-amber-100 text-amber-900 border-amber-300', punto: 'bg-amber-500', texto: 'Exceso' };

  return (
    <article className={`bg-white border border-neutral-200 border-l-4 p-4 rounded-xl shadow-sm tarjeta-naturaleza ${semaforo.borde}`}>
      <header className="flex flex-wrap gap-2 justify-between items-center">
        <h3 className="font-semibold text-humus flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${semaforo.punto}`} aria-hidden />
          {hallazgo.parametro} — <span className="numeros">{hallazgo.valor} {hallazgo.unidad}</span>
          <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 border ${semaforo.insignia}`}>{semaforo.texto}</span>
        </h3>
        <button className="boton-campo text-sm font-semibold text-emerald-700 underline underline-offset-4" onClick={() => setDetalle((v) => !v)} aria-expanded={detalle}>
          {detalle ? 'Ocultar' : 'Por qué'}
        </button>
      </header>
      {detalle && (
        <div className="mt-2 text-sm grid gap-2 text-neutral-600">
          <p>{hallazgo.porque}</p>
          <p className="italic">Fuente: {hallazgo.referenciaBibliografica}</p>
          <div className="flex gap-2 flex-wrap">
            {(['aceptada', 'rechazada', 'editada'] as DecisionTecnico[]).map((d) => (
              <button
                key={d}
                className={`boton-campo px-4 py-2 text-sm font-semibold rounded-sm border transition-colors ${decision === d ? 'bg-[#059669] text-white border-[#059669]' : 'bg-white text-neutral-600 border-neutral-300 hover:border-[#059669]'}`}
                onClick={() => setDecision(d)}
              >
                {d}
              </button>
            ))}
          </div>
          {decision && <p>Decisión técnico: {decision} (se guarda como nueva versión de estrategia, nunca se sobrescribe).</p>}
        </div>
      )}
    </article>
  );
}
