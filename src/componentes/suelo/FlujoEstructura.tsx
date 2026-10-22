import { useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { NIVELES_VESS } from '../../datos/fisicas';
import {
  PASOS_ESTRUCTURA, ADVERTENCIA_ESTRUCTURA, FUENTES_ESTRUCTURA, textoEstadoEstructura,
} from '../../datos/estructura_vess';
import { ProgresoPasos } from './ProgresoPasos';

const BOTON_PRIMARIO =
  'boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const BOTON_SQ =
  'boton-campo p-3 rounded-sm border text-left transition-colors min-h-[44px]';
const BOTON_GHOST = 'text-xs text-emerald-700 underline underline-offset-2 w-fit';

const COMPACTACION = ['suelto', 'friable', 'firme', 'compactado / hardpan'];
const INFILTRACION = ['rápida', 'moderada', 'lenta', 'encharca'];

const ILUSTRACION: (string | null)[] = ['estructura-bloque', 'estructura-agregados', null, null];

// Flujo guiado VESS: preparar bloque → puntuar Sq1–Sq5 → contexto → confirmar.
// Al confirmar deja estructuraVess, estructuraDesc y el contexto en la ficha.
export function FlujoEstructura({ fijar, valores }: {
  fijar: UseFormSetValue<FichaSueloFormulario>;
  valores: Partial<FichaSueloFormulario>;
}) {
  const [paso, setPaso] = useState(0);
  const [sq, setSq] = useState<number | undefined>(valores.estructuraVess);
  const [compactacion, setCompactacion] = useState(valores.compactacion ?? '');
  const [infiltracion, setInfiltracion] = useState(valores.infiltracion ?? '');
  const [profundidad, setProfundidad] = useState(
    valores.profundidadEfectivaCm !== undefined ? String(valores.profundidadEfectivaCm) : '',
  );
  const [notas, setNotas] = useState('');

  const nivel = NIVELES_VESS.find((n) => n.sq === sq);
  const nota = notas.trim();
  const descripcion = sq !== undefined ? `VESS Sq${sq}${nota ? ` · ${nota}` : ''}` : null;

  const ir = (i: number) => setPaso(Math.max(0, Math.min(PASOS_ESTRUCTURA.length - 1, i)));
  const elegir = (n: number) => { setSq(n); ir(2); };

  const usar = () => {
    if (sq === undefined) return;
    fijar('estructuraVess', sq);
    fijar('estructuraDesc', descripcion ?? `VESS Sq${sq}`);
    fijar('compactacion', compactacion || undefined);
    fijar('infiltracion', infiltracion || undefined);
    const prof = profundidad.trim() ? Number(profundidad) : undefined;
    fijar('profundidadEfectivaCm', prof !== undefined && Number.isFinite(prof) ? prof : undefined);
  };

  const ilustracion = ILUSTRACION[paso];

  return (
    <div className="grid gap-3">
      <ProgresoPasos pasos={PASOS_ESTRUCTURA} actual={paso} />

      <div className="border border-neutral-200 bg-neutral-50/60 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[168px_1fr] sm:items-start">
          {ilustracion && (
            <img
              src={`/imagenes/metodos/${ilustracion}.svg`}
              alt="Apoyo visual para evaluar la estructura del suelo"
              loading="lazy"
              className="w-full max-w-[168px] self-start"
            />
          )}
          <div className="grid gap-2.5">
            {paso === 0 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">Prepara el bloque</p>
                <ul className="grid list-disc gap-0.5 pl-4 text-sm text-neutral-600">
                  <li>Con humedad de campo, extrae un bloque de 20 × 20 × 20 cm sin pisar el borde.</li>
                  <li>Ábrelo como un libro y observa agregados, poros, raíces y capas.</li>
                  <li>Si hay varias capas, puntúa cada una y promedia por espesor.</li>
                </ul>
                <div><button type="button" className={BOTON_PRIMARIO} onClick={() => ir(1)}>Empezar</button></div>
              </>
            )}

            {paso === 1 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">Compara con la escala VESS</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {NIVELES_VESS.map((n) => (
                    <button
                      key={n.sq} type="button"
                      onClick={() => elegir(n.sq)}
                      aria-pressed={sq === n.sq}
                      className={`${BOTON_SQ} ${sq === n.sq
                        ? 'bg-[#059669] text-white border-[#059669]'
                        : 'bg-white border-neutral-300 hover:border-[#059669]'}`}
                    >
                      <span className="block text-lg font-semibold leading-tight">Sq{n.sq}</span>
                      <span className="block text-xs font-medium">{n.titulo.split('·')[1]?.trim()}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-500">Elige el nivel que mejor describa el bloque; podrás ajustar el contexto en el paso siguiente.</p>
              </>
            )}

            {paso === 2 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">Contexto del bloque</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="etiqueta-campo">Compactación
                    <select className="campo-entrada" value={compactacion} onChange={(e) => setCompactacion(e.target.value)}>
                      <option value="">— Sin registrar —</option>
                      {COMPACTACION.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="etiqueta-campo">Infiltración
                    <select className="campo-entrada" value={infiltracion} onChange={(e) => setInfiltracion(e.target.value)}>
                      <option value="">— Sin registrar —</option>
                      {INFILTRACION.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="etiqueta-campo">Prof. efectiva (cm)
                    <input className="campo-entrada" type="number" step="1" min="0" value={profundidad} onChange={(e) => setProfundidad(e.target.value)} />
                  </label>
                  <label className="etiqueta-campo">Notas del bloque
                    <input className="campo-entrada" maxLength={80} placeholder="Ej: granular friable" value={notas} onChange={(e) => setNotas(e.target.value)} />
                  </label>
                </div>
                <p className="text-xs text-neutral-500">Profundidad efectiva: hasta la capa dura, el nivel freático o la roca que limita raíces.</p>
                <div><button type="button" className={BOTON_PRIMARIO} onClick={() => ir(3)}>Ver resultado</button></div>
              </>
            )}

            {paso === 3 && sq !== undefined && nivel && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Estructura del bloque</p>
                <p className="text-2xl font-semibold text-neutral-800">Sq{sq} <span className="text-sm font-normal text-neutral-500">· {nivel.titulo.split('·')[1]?.trim()}</span></p>
                <p className="text-sm text-neutral-600">{nivel.descripcion}</p>
                <p className={`text-sm font-medium ${sq <= 2 ? 'text-emerald-700' : sq === 3 ? 'text-amber-600' : 'text-red-700'}`}>
                  {textoEstadoEstructura(sq)}
                </p>
                {(compactacion || infiltracion || profundidad) && (
                  <p className="text-xs text-neutral-500">
                    {compactacion && <>Compactación: <strong className="font-semibold text-neutral-700">{compactacion}</strong>. </>}
                    {infiltracion && <>Infiltración: <strong className="font-semibold text-neutral-700">{infiltracion}</strong>. </>}
                    {profundidad && <>Prof. efectiva: <strong className="font-semibold text-neutral-700">{profundidad} cm</strong>.</>}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button type="button" className={BOTON_PRIMARIO} onClick={usar}>
                    Usar esta estructura en la ficha
                  </button>
                  <button type="button" className={BOTON_GHOST} onClick={() => ir(1)}>Cambiar puntaje</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {paso > 0 && <button type="button" className={BOTON_GHOST} onClick={() => ir(paso - 1)}>← Paso anterior</button>}
      {valores.estructuraVess !== undefined && (
        <p className="text-xs text-neutral-500">Registrado en la ficha: <strong className="font-semibold text-neutral-700">{valores.estructuraDesc ?? `VESS Sq${valores.estructuraVess}`}</strong></p>
      )}
      <p className="text-xs text-neutral-500">{ADVERTENCIA_ESTRUCTURA}</p>
      <p className="text-[11px] text-neutral-400">Fuente: {FUENTES_ESTRUCTURA[0]}; {FUENTES_ESTRUCTURA[1]}.</p>
    </div>
  );
}
