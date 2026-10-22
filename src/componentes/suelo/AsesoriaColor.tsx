import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { munsellChip, ADVERTENCIA_MUNSELL, MINERALES_MUNSELL, FUENTE_MINERALES } from '../../datos/fisicas';
import { interpretarColor, FUENTES_COLOR, ADVERTENCIA_COLOR } from '../../datos/color_munsell';

// Panel de asesoría del color: muestra la notación registrada, su interpretación
// (materia orgánica, óxidos de hierro, drenaje) y la tabla mineral de referencia.
export function AsesoriaColor({ valores }: { valores: Partial<FichaSueloFormulario> }) {
  const chip = valores.munsellH ? munsellChip(valores.munsellH, valores.munsellV, valores.munsellC) : null;
  const lectura = interpretarColor(valores.munsellH, valores.munsellV, valores.munsellC);

  return (
    <div className="grid gap-2.5">
      <div className="border border-neutral-200 bg-white p-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Color registrado</p>
        {valores.munsellH ? (
          <div className="mt-1 flex items-center gap-3">
            {chip && (
              <span className="h-12 w-12 shrink-0 rounded-sm border border-neutral-300" style={{ background: chip.css }} aria-hidden />
            )}
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                {valores.munsellH} {valores.munsellV ?? '?'}/{valores.munsellC ?? '?'}
                {valores.colorEstado ? ` · ${valores.colorEstado}` : ''}
              </p>
              {chip && <p className="text-[11px] text-neutral-500">{chip.etiqueta}</p>}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">Sin registrar</p>
        )}
      </div>

      {lectura ? (
        <p className="border border-neutral-200 bg-neutral-50 p-2.5 text-sm text-neutral-600">
          <strong className="font-semibold text-neutral-800">{lectura.titulo}.</strong> {lectura.texto}
        </p>
      ) : (
        <p className="text-xs text-neutral-500">{ADVERTENCIA_MUNSELL}</p>
      )}

      <details className="border border-neutral-200 bg-white">
        <summary className="cursor-pointer p-2.5 text-xs font-medium text-emerald-700">Tabla mineral → Munsell → color</summary>
        <div className="overflow-x-auto px-2.5 pb-2.5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-400">
                <th className="py-1 pr-2 font-medium">Mineral</th>
                <th className="py-1 pr-2 font-medium">Munsell</th>
                <th className="py-1 font-medium">Color</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {MINERALES_MUNSELL.map((m) => (
                <tr key={m.mineral}>
                  <td className="py-1 pr-2 text-neutral-700">{m.mineral}</td>
                  <td className="py-1 pr-2 font-medium">{m.munsell}</td>
                  <td className="py-1 text-neutral-600">{m.color}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-neutral-500">Fuente: {FUENTE_MINERALES}.</p>
        </div>
      </details>

      <p className="text-xs text-neutral-500">{ADVERTENCIA_COLOR}</p>
      <details className="text-xs text-neutral-500">
        <summary className="cursor-pointer font-medium text-emerald-700">Fuentes de la asesoría</summary>
        <ul className="mt-1 grid gap-0.5">
          {FUENTES_COLOR.map((f) => <li key={f}>· {f}</li>)}
        </ul>
      </details>
    </div>
  );
}
