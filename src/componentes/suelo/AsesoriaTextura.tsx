import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { claseDeEtiqueta, clasificarTextura } from '../../datos/fisicas';
import {
  INFO_CLASE, nombreClase, FUENTES_TEXTURA, ADVERTENCIA_TEXTURA,
} from '../../datos/textura_tacto';

// Panel de asesoría y verificación cruzada: confronta la clase estimada al tacto
// (campo) con la clase calculada del análisis granulométrico (laboratorio).
export function AsesoriaTextura({ valores }: { valores: Partial<FichaSueloFormulario> }) {
  const claseCampo = claseDeEtiqueta(valores.texturaTacto);
  const claseLab = clasificarTextura(valores.arenaPct, valores.limoPct, valores.arcillaPct);
  const hayGranulometria = valores.arenaPct !== undefined && valores.limoPct !== undefined && valores.arcillaPct !== undefined;

  const infoCampo = claseCampo ? INFO_CLASE[claseCampo] : null;
  const infoLab = claseLab ? INFO_CLASE[claseLab] : null;

  let veredicto: { tono: 'ok' | 'aviso' | 'info'; texto: string };
  if (claseCampo && claseLab) {
    veredicto = claseCampo === claseLab
      ? { tono: 'ok', texto: `Compatible: el tacto en campo y el laboratorio coinciden en ${nombreClase(claseLab)}.` }
      : { tono: 'aviso', texto: `No coinciden: en campo estimaste ${nombreClase(claseCampo)} y el laboratorio indica ${nombreClase(claseLab)}. Cerca de los límites entre clases es normal; prevalece el laboratorio.` };
  } else if (claseCampo) {
    veredicto = { tono: 'info', texto: 'Solo hay determinación al tacto. Registra la granulometría para verificar la clase.' };
  } else if (claseLab) {
    veredicto = { tono: 'info', texto: 'Solo hay análisis de laboratorio. Registra el tacto para contrastar en campo.' };
  } else if (hayGranulometria) {
    veredicto = { tono: 'aviso', texto: 'Los porcentajes de arena, limo y arcilla no suman 100 ± 2: revisa los datos del reporte.' };
  } else {
    veredicto = { tono: 'info', texto: 'Aún no hay textura registrada. Usa el flujo al tacto o carga la granulometría del laboratorio.' };
  }

  const colorVeredicto =
    veredicto.tono === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
      : veredicto.tono === 'aviso' ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-neutral-200 bg-neutral-50 text-neutral-600';

  return (
    <div className="grid gap-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="border border-neutral-200 bg-white p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Campo · al tacto</p>
          {claseCampo && infoCampo ? (
            <>
              <p className="text-sm font-semibold text-neutral-800">{nombreClase(claseCampo)}</p>
              <p className="text-xs text-neutral-500">Agua {infoCampo.agua.toLowerCase()} · arcilla {infoCampo.arcilla.toLowerCase()}</p>
            </>
          ) : (
            <p className="text-sm text-neutral-500">Sin registrar</p>
          )}
        </div>
        <div className="border border-neutral-200 bg-white p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Laboratorio · granulometría</p>
          {claseLab && infoLab ? (
            <>
              <p className="text-sm font-semibold text-neutral-800">{nombreClase(claseLab)}</p>
              <p className="text-xs text-neutral-500">Agua {infoLab.agua.toLowerCase()} · arcilla {infoLab.arcilla.toLowerCase()}</p>
            </>
          ) : (
            <p className="text-sm text-neutral-500">Sin registrar</p>
          )}
        </div>
      </div>

      <p className={`border p-2.5 text-sm ${colorVeredicto}`}>{veredicto.texto}</p>

      {(infoCampo ?? infoLab) && (
        <p className="text-xs text-neutral-600">
          <strong className="font-semibold text-neutral-800">Manejo sugerido:</strong> {(infoLab ?? infoCampo)!.manejo}
        </p>
      )}

      <p className="text-xs text-neutral-500">{ADVERTENCIA_TEXTURA}</p>
      <details className="text-xs text-neutral-500">
        <summary className="cursor-pointer font-medium text-emerald-700">Fuentes de la asesoría</summary>
        <ul className="mt-1 grid gap-0.5">
          {FUENTES_TEXTURA.map((f) => <li key={f}>· {f}</li>)}
        </ul>
      </details>
    </div>
  );
}
