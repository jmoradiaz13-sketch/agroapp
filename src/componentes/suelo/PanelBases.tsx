import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  CATIONES, FUENTES_QUIMICAS, META_AL_PCT, aNumero, derivarBases, rangoDe, textoAvisosBases, textoRango,
} from '../../datos/quimicas';
import {
  Aviso, BalanzaCationes, CampoBase, CampoNumero, Columna, Fuente, Metodo,
} from './quimicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type S = UseFormSetValue<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

function rangoTexto(parametro: string): string | undefined {
  const rango = rangoDe(parametro);
  return rango ? textoRango(rango) : undefined;
}

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="grid gap-1 border border-neutral-200 bg-white p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{titulo}</p>
      <p className="text-lg font-semibold leading-tight text-humus">{valor}</p>
      <p className="text-[11px] leading-snug text-neutral-500">{detalle}</p>
    </div>
  );
}

export function PanelBases({ registro, fijar, valores }: { registro: R; fijar: S; valores: V }) {
  const derivados = derivarBases(valores);
  const cic = aNumero(valores.cicCmolKg);
  const satManual = aNumero(valores.saturacionAlPct);
  const avisos = textoAvisosBases(valores);

  if (satManual !== undefined && derivados.saturacionAlPct !== null && Math.abs(satManual - derivados.saturacionAlPct) > 0.5) {
    avisos.push(`La saturación de Al del reporte (${satManual} %) no coincide con la calculada (${derivados.saturacionAlPct} %). Revisa Al y CIC.`);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Columna titulo="Registro del reporte">
        <div className="grid gap-2 sm:grid-cols-2">
          {CATIONES.map((c) => (
            <CampoBase
              key={c.id}
              id={c.id}
              etiqueta={c.etiqueta}
              simbolo={c.simbolo}
              nombre={c.id}
              unidad="cmol/kg"
              registro={registro}
              valor={valores[c.id]}
              rango={rangoTexto(c.id)}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoNumero
            etiqueta="CIC / CICE" unidad="cmol/kg" nombre="cicCmolKg" registro={registro}
            maximo={60} paso="0.1" placeholder="Ej: 12,5"
            ayuda="Capacidad de intercambio catiónico del reporte."
          />
          <CampoNumero
            etiqueta="Saturación de Al del reporte" unidad="%" nombre="saturacionAlPct" registro={registro}
            maximo={100} paso="0.1" placeholder="Ej: 18"
            ayuda="Si el reporte la trae, prevalece sobre la calculada."
          />
        </div>
        <Metodo titulo="Acetato de amonio + absorción atómica (SENA La Granja, prácticas 12 y 14)">
          <p>Las bases (Ca, Mg, K, Na) se extraen con acetato de amonio 1 M a pH 7. La CIC se obtiene por saturación y titulación. La saturación de bases es la suma de bases dividida por la CIC.</p>
          <p className="text-xs text-neutral-500">Transcribe los valores del reporte; no se recalculan los cationes.</p>
        </Metodo>
        {avisos.map((a) => <Aviso key={a} tono="aviso">{a}</Aviso>)}
        <Fuente texto={`${FUENTES_QUIMICAS.bases}; ${FUENTES_QUIMICAS.aluminio}`} />
      </Columna>

      <div className="grid content-start gap-3">
        <Columna titulo="Balance de cationes">
          <BalanzaCationes valores={valores} cic={cic} />
        </Columna>

        <Columna titulo="Indicadores derivados">
          <div className="grid gap-2 sm:grid-cols-2">
            <Indicador
              titulo="Suma de bases"
              valor={derivados.sumaBases !== null ? `${derivados.sumaBases} cmol/kg` : '—'}
              detalle="Ca + Mg + K + Na · calculado"
            />
            <Indicador
              titulo="Saturación de bases"
              valor={derivados.saturacionBasesPct !== null ? `${derivados.saturacionBasesPct} %` : '—'}
              detalle="Suma de bases ÷ CIC × 100 · calculado"
            />
            <Indicador
              titulo="Saturación de Al calculada"
              valor={derivados.saturacionAlPct !== null ? `${derivados.saturacionAlPct} %` : '—'}
              detalle="Al ÷ CIC × 100 · calculado, no se almacena"
            />
            <Indicador
              titulo="Meta de Al en la fórmula"
              valor={`≤ ${META_AL_PCT} %`}
              detalle="Supuesto documentado de la enmienda (AGENTS §4.3)"
            />
          </div>

          {satManual === undefined && derivados.saturacionAlPct !== null && (
            <button
              type="button"
              className="boton-campo w-fit border border-emerald-700 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              onClick={() => fijar('saturacionAlPct', derivados.saturacionAlPct ?? undefined)}
            >
              Usar la saturación de Al calculada
            </button>
          )}
          {satManual !== undefined && (
            <p className="text-xs leading-relaxed text-neutral-500">
              Se conserva la saturación de Al del reporte ({satManual} %). La calculada queda solo como verificación.
            </p>
          )}

          <div className="grid gap-1 border border-neutral-200 bg-neutral-50 p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Cocientes informativos</p>
            <dl className="grid gap-1 text-xs text-neutral-600">
              <div className="flex justify-between gap-3"><dt>Ca / Mg</dt><dd className="font-medium text-humus">{derivados.caMg ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt>Mg / K</dt><dd className="font-medium text-humus">{derivados.mgK ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt>(Ca + Mg) / K</dt><dd className="font-medium text-humus">{derivados.caMgK ?? '—'}</dd></div>
            </dl>
            <p className="text-[11px] leading-snug text-neutral-500">
              Se muestran como valores informativos. No se clasifican porque el rango depende del cultivo y del manual del laboratorio.
            </p>
          </div>
        </Columna>
      </div>
    </div>
  );
}
