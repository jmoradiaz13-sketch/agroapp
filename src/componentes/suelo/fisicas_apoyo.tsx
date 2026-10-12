import { useState } from 'react';
import {
  CLASES_ES, DENSIDAD_NRCS, interpretarDensidad,
  type ClaseTextural,
} from '../../datos/fisicas';

// Apoyos del deck de físicas: árbol FAO al tacto, triángulo USDA,
// semáforo de densidad y conversor tacto→clase. Sin estado de formulario.
export function Fuente({ texto }: { texto: string }) {
  return <p className="text-xs text-neutral-500">Fuente: {texto}</p>;
}

export function Columna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-200 bg-white p-4 grid gap-3 content-start">
      <h4 className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">{titulo}</h4>
      {children}
    </div>
  );
}

// Árbol FAO 3 pasos: bola → cinta → tacto (aproximación de campo).
export function ArbolTextura({ alElegir }: { alElegir: (clase: string) => void }) {
  const [paso, setPaso] = useState(1);
  const [cinta, setCinta] = useState('');
  if (paso === 1) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-medium">1 · Humedece y aprieta: ¿forma bola que no se deshace?</p>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#059669]" onClick={() => setPaso(2)}>Sí forma bola</button>
          <button type="button" className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#059669]" onClick={() => alElegir('Arenoso (arena / arena franca)')}>No, se desmorona</button>
        </div>
      </div>
    );
  }
  if (paso === 2) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-medium">2 · Presiona entre pulgar e índice: ¿forma cinta?</p>
        <div className="flex gap-2 flex-wrap">
          {[['no', 'No forma cinta'], ['corta', 'Cinta corta (< 2,5 cm)'], ['larga', 'Cinta larga (> 2,5 cm)']].map(([v, t]) => (
            <button
              key={v} type="button"
              className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#059669]"
              onClick={() => { if (v === 'no') { alElegir('Franco (franco arenoso / limoso: define al tacto)'); } else { setCinta(v); setPaso(3); } }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">3 · Frota la cinta: ¿cómo se siente?</p>
      <div className="flex gap-2 flex-wrap">
        {[
          ['áspera', cinta === 'larga' ? 'Arcillo arenoso' : 'Franco arcillo arenoso'],
          ['suave', cinta === 'larga' ? 'Franco arcilloso / limoso' : 'Franco arcilloso'],
          ['jabonosa', 'Arcilloso (posible esmectita 2:1)'],
        ].map(([t, r]) => (
          <button
            key={t} type="button"
            className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#059669]"
            onClick={() => alElegir(r)}
          >
            {t}
          </button>
        ))}
      </div>
      <button type="button" className="text-xs text-emerald-700 underline underline-offset-2 w-fit" onClick={() => setPaso(1)}>Reiniciar árbol</button>
    </div>
  );
}

export function Triangulo({ arena, limo, arcilla, clase }: { arena: number; limo: number; arcilla: number; clase: string }) {
  const x = 8 + ((arena + limo / 2) / 100) * 184;
  const y = 165 - (arcilla / 100) * 157;
  return (
    <figure className="grid gap-1">
      <svg viewBox="0 0 200 180" className="w-full max-w-[260px]" role="img" aria-label={`Triángulo textural USDA: ${clase}`}>
        <polygon points="100,8 8,165 192,165" fill="#f5f5f4" stroke="#059669" strokeWidth="2" />
        <text x="100" y="14" textAnchor="middle" fontSize="9" fill="#525252">Arcilla</text>
        <text x="14" y="176" fontSize="9" fill="#525252">Arena</text>
        <text x="186" y="176" textAnchor="end" fontSize="9" fill="#525252">Limo</text>
        <circle cx={x} cy={y} r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
      </svg>
      <figcaption className="text-xs text-neutral-500">Punto según tu granulometría: {clase}</figcaption>
    </figure>
  );
}

export function tactoAClase(tacto: string): ClaseTextural | null {
  const t = tacto.toLowerCase();
  if (t.includes('arcillo arenoso')) return 'arcillo-arenoso';
  if (t.includes('franco arcillo arenoso')) return 'franco-arcillo-arenoso';
  if (t.includes('franco arcilloso')) return 'franco-arcilloso';
  if (t.includes('arcilloso') || t.includes('arcilla')) return 'arcilla';
  if (t.includes('limoso')) return 'franco-limoso';
  if (t.includes('franco arenoso')) return 'franco-arenoso';
  if (t.includes('arenoso') || t.includes('arena')) return 'arena';
  if (t.includes('franco')) return 'franco';
  return null;
}

export function SemaforoDensidad({ da, clase }: { da: number; clase: ClaseTextural }) {
  const estado = interpretarDensidad(da, clase);
  const u = DENSIDAD_NRCS[clase];
  return (
    <p className={`text-sm font-medium ${estado === 'optimo' ? 'text-emerald-700' : estado === 'vigilar' ? 'text-amber-600' : 'text-red-700'}`}>
      {estado === 'optimo' ? '✓ Óptima' : estado === 'vigilar' ? '● Vigilar' : '✕ Restringe raíces'} para {CLASES_ES[clase]} (ideal &lt; {u.idealMax} · restringe &gt; {u.restringeMin} g/cm³)
    </p>
  );
}
