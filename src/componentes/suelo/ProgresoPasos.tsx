// Indicador de progreso por pasos, compartido por los flujos guiados de campo.
export function ProgresoPasos({ pasos, actual }: { pasos: readonly string[]; actual: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Pasos del método">
      {pasos.map((p, i) => {
        const estado = i < actual ? 'hecho' : i === actual ? 'activo' : 'pendiente';
        const clases =
          estado === 'activo'
            ? 'border-[#059669] bg-[#059669] text-white'
            : estado === 'hecho'
              ? 'border-[#059669] bg-[#ecfdf5] text-emerald-700'
              : 'border-neutral-300 bg-white text-neutral-400';
        return (
          <li key={p} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${clases}`}>
              <span aria-hidden>{estado === 'hecho' ? '✓' : i + 1}</span>
              {p}
            </span>
            {i < pasos.length - 1 && <span className="h-px w-3 bg-neutral-300" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
