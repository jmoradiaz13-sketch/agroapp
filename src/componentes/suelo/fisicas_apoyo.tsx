import {
  CLASES_ES, DENSIDAD_NRCS, interpretarDensidad,
  type ClaseTextural,
} from '../../datos/fisicas';

// Apoyos del deck de físicas: triángulo USDA, semáforo de densidad y
// conversor tacto→clase. Sin estado de formulario.
export function Fuente({ texto }: { texto: string }) {
  return <p className="text-xs text-neutral-500">Fuente: {texto}</p>;
}

export function Columna({ titulo, className, children }: { titulo: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`border border-neutral-200 bg-white p-4 grid gap-3 content-start ${className ?? ''}`}>
      <h4 className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">{titulo}</h4>
      {children}
    </div>
  );
}

export function Triangulo({ arena, limo, arcilla, clase }: { arena: number; limo: number; arcilla: number; clase: string }) {
  const x = 8 + ((arena + limo / 2) / 100) * 184;
  const y = 165 - (arcilla / 100) * 157;
  return (
    <figure className="grid gap-1">
      <svg viewBox="0 0 200 180" className="w-full max-w-[260px]" role="img" aria-label={`Triángulo textural USDA: ${clase}`}>
        <polygon points="100,8 8,165 192,165" fill="#f5f5f4" stroke="#14736E" strokeWidth="2" />
        <text x="100" y="14" textAnchor="middle" fontSize="9" fill="#525252">Arcilla</text>
        <text x="14" y="176" fontSize="9" fill="#525252">Arena</text>
        <text x="186" y="176" textAnchor="end" fontSize="9" fill="#525252">Limo</text>
        <circle cx={x} cy={y} r="5" fill="#14736E" stroke="#fff" strokeWidth="2" />
      </svg>
      <figcaption className="text-xs text-neutral-500">Punto según tu granulometría: {clase}</figcaption>
    </figure>
  );
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
