import { useState } from 'react';
import type { Hallazgo, DecisionTecnico } from '../esquemas/diagnostico';

// El Técnico Decide: sugiere el sistema, decide el técnico. Justifica el porqué.
export function TarjetaDiagnostico({ hallazgo }: { hallazgo: Hallazgo }) {
  const [decision, setDecision] = useState<DecisionTecnico | null>(null);
  const [detalle, setDetalle] = useState(false);
  const color =
    hallazgo.estado === 'optimo' ? 'border-l-green-600'
    : hallazgo.estado === 'deficiente' ? 'border-l-yellow-500'
    : 'border-l-red-600';

  return (
    <article className={`bg-white border border-neutral-200 border-l-4 p-4 ${color}`}>
      <header className="flex flex-wrap gap-2 justify-between items-center">
        <h3 className="font-semibold text-humus">{hallazgo.parametro} — {hallazgo.valor} {hallazgo.unidad} ({hallazgo.estado})</h3>
        <button className="boton-campo text-sm font-semibold text-emerald-700 underline underline-offset-4" onClick={() => setDetalle((v) => !v)}>
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
