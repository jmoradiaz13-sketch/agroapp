import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  FUENTES_QUIMICAS, aNumero, derivarBases, textoAvisosBases,
} from '../../datos/quimicas';
import {
  VARIABLES_QUIMICAS, TEXTO_ESTADO, estadoVariable, resumenVariables, type EstadoVariable,
} from '../../datos/variables_suelo';
import { Aviso, Fuente } from './quimicas_apoyo';

type V = Partial<FichaSueloFormulario>;

const PUNTO: Record<EstadoVariable, string> = {
  pendiente: 'bg-neutral-300',
  en_progreso: 'bg-amber-500',
  registrada: 'bg-[#059669]',
};

function valorClave(id: string, valores: V): string {
  if (id === 'acidez') {
    const ph = aNumero(valores.phAgua) ?? aNumero(valores.phCampo);
    return ph !== undefined ? `pH ${ph}` : 'Sin pH';
  }
  if (id === 'salinidad') {
    const ce = aNumero(valores.conductividadDsM) ?? aNumero(valores.ceCampo);
    return ce !== undefined ? `${ce} dS/m` : 'Sin CE';
  }
  if (id === 'materia') {
    const mo = aNumero(valores.materiaOrganicaPct);
    const n = aNumero(valores.nitrogenoPct);
    if (mo === undefined && n === undefined) return 'Sin MO ni N';
    return [mo !== undefined ? `MO ${mo} %` : null, n !== undefined ? `N ${n} %` : null].filter(Boolean).join(' · ');
  }
  if (id === 'bases') {
    const d = derivarBases(valores);
    const cic = aNumero(valores.cicCmolKg);
    if (cic === undefined) return 'Sin CIC';
    if (d.saturacionAlPct !== null) return `CIC ${cic} · Al sat. ${d.saturacionAlPct} %`;
    return `CIC ${cic} cmol/kg`;
  }
  if (id === 'fosforo') {
    const p = aNumero(valores.fosforoMgKg);
    if (p === undefined) return 'Sin fósforo';
    return `${p} mg/kg${valores.metodoFosforo ? ` · ${valores.metodoFosforo}` : ' · sin método'}`;
  }
  return '';
}

export function ResumenQuimico({
  valores, alElegir, alIrResumen,
}: { valores: V; alElegir: (id: string) => void; alIrResumen?: () => void }) {
  const { registradas, total } = resumenVariables('quimicas', valores);
  const avance = total === 0 ? 0 : Math.round((registradas / total) * 100);
  const avisos = textoAvisosBases(valores);
  if (aNumero(valores.fosforoMgKg) !== undefined && !valores.metodoFosforo) {
    avisos.push('El fósforo está registrado sin método extractante: la comparación con el rango queda incompleta.');
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-display text-xl font-medium text-humus">Resumen químico</h4>
          <p className="text-xs font-medium text-neutral-500">{registradas} de {total} variables registradas</p>
        </div>
        <div className="relative h-1.5 rounded-full bg-neutral-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={avance} aria-label="Cobertura de variables químicas">
          <span className="absolute inset-y-0 left-0 rounded-full bg-[#059669] transition-all" style={{ width: `${avance}%` }} />
        </div>
        <p className="text-xs leading-relaxed text-neutral-500">
          La cobertura cuenta variables con al menos un dato. Solo los 7 parámetros con rango validado se interpretan; el resto se guarda como registro.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {VARIABLES_QUIMICAS.map((v) => {
          const estado = estadoVariable(v, valores);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => alElegir(v.id)}
              className="boton-campo grid gap-1.5 border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-emerald-600"
              aria-label={`Abrir ${v.titulo}: ${TEXTO_ESTADO[estado.estado]}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-humus">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${PUNTO[estado.estado]}`} aria-hidden />
                {v.titulo}
                <span className="ml-auto text-[11px] font-medium text-neutral-500">{TEXTO_ESTADO[estado.estado]}</span>
              </span>
              <span className="text-sm font-medium text-neutral-700">{valorClave(v.id, valores)}</span>
              <span className="text-[11px] leading-snug text-neutral-500">{v.descripcion}</span>
            </button>
          );
        })}
      </div>

      {avisos.length > 0 && (
        <div className="grid gap-2">
          {avisos.map((a) => <Aviso key={a} tono="aviso">{a}</Aviso>)}
        </div>
      )}

      <div className="grid gap-1 border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs font-semibold text-neutral-700">Qué falta para interpretar</p>
        <ul className="grid gap-1 text-xs leading-relaxed text-neutral-600">
          {VARIABLES_QUIMICAS.filter((v) => estadoVariable(v, valores).estado !== 'registrada').map((v) => (
            <li key={v.id}>
              <strong className="font-semibold text-humus">{v.titulo}:</strong> {v.paraConfirmar}
            </li>
          ))}
          {VARIABLES_QUIMICAS.every((v) => estadoVariable(v, valores).estado === 'registrada') && (
            <li>Las cinco variables tienen datos. Revisa la coherencia y guarda la ficha para conservar la versión.</li>
          )}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-neutral-500">
        Los valores derivados se calculan en pantalla y no se almacenan, salvo que uses el botón de saturación de Al en Bases. Cada guardado crea una nueva versión con fecha; no se sobrescribe el historial.
      </p>
      <Fuente texto={`${FUENTES_QUIMICAS.acidez}; ${FUENTES_QUIMICAS.bases}; ${FUENTES_QUIMICAS.fosforo}`} />

      {alIrResumen && (
        <div>
          <button
            type="button"
            onClick={alIrResumen}
            className="boton-campo bg-[#059669] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#047857]"
          >
            Ir a la interpretación general
          </button>
        </div>
      )}
    </div>
  );
}
