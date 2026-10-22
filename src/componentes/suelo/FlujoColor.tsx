import { useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { MUNSELL_TONOS, munsellChip } from '../../datos/fisicas';
import {
  PASOS_COLOR, VALORES_COLOR, CROMAS_COLOR, ADVERTENCIA_COLOR, FUENTES_COLOR, interpretarColor,
} from '../../datos/color_munsell';
import { ProgresoPasos } from './ProgresoPasos';

const BOTON_PRIMARIO =
  'boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors';
const BOTON_OPCION =
  'boton-campo text-left px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#059669] transition-colors';
const BOTON_GHOST = 'text-xs text-emerald-700 underline underline-offset-2 w-fit';
const BOTON_CHIP =
  'boton-campo min-w-[44px] px-3 py-2 text-sm font-semibold rounded-sm border border-neutral-300 bg-white hover:border-[#059669] transition-colors';

type EstadoColor = 'humedo' | 'seco';

const ILUSTRACION_PASO: Record<number, string> = {
  0: 'color-muestra',
  1: 'color-humedad',
  2: 'munsell-sistema',
  3: 'color-carta',
  4: 'color-carta',
};

// Flujo guiado de estimación del color (metodología Munsell): preparación de la
// muestra y la luz → humedad → tono → valor → croma → notación e interpretación.
export function FlujoColor({ fijar, valores }: {
  fijar: UseFormSetValue<FichaSueloFormulario>;
  valores: Partial<FichaSueloFormulario>;
}) {
  const [paso, setPaso] = useState(0);
  const [tono, setTono] = useState(valores.munsellH ?? '');
  const [valor, setValor] = useState<number | null>(valores.munsellV ?? null);
  const [croma, setCroma] = useState<number | null>(valores.munsellC ?? null);
  const [estado, setEstado] = useState<EstadoColor | null>(
    valores.colorEstado === 'humedo' || valores.colorEstado === 'seco' ? valores.colorEstado : null,
  );

  const completo = tono !== '' && valor !== null && croma !== null;
  const chip = completo ? munsellChip(tono, valor as number, croma as number) : null;
  const lectura = interpretarColor(tono || null, valor, croma);

  const ir = (i: number) => setPaso(Math.max(0, Math.min(PASOS_COLOR.length - 1, i)));

  const registrar = (t = tono, v = valor, c = croma, e = estado) => {
    if (t === '' || v === null || c === null) return;
    fijar('munsellH', t);
    fijar('munsellV', v);
    fijar('munsellC', c);
    fijar('colorMunsell', `${t} ${v}/${c}`);
    if (e) fijar('colorEstado', e);
  };

  const elegirEstado = (e: EstadoColor) => { setEstado(e); fijar('colorEstado', e); ir(2); };
  const elegirTono = (t: string) => { setTono(t); ir(3); };
  const elegirValor = (v: number) => { setValor(v); ir(4); };
  const elegirCroma = (c: number) => { setCroma(c); ir(5); registrar(tono, valor, c, estado); };

  const ilustracion = ILUSTRACION_PASO[paso];

  return (
    <div className="grid gap-3">
      <ProgresoPasos pasos={PASOS_COLOR} actual={paso} />

      <div className="border border-neutral-200 bg-neutral-50/60 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[168px_1fr] sm:items-start">
          {ilustracion && (
            <img
              src={`/imagenes/metodos/${ilustracion}.svg`}
              alt="Apoyo visual del método de color"
              loading="lazy"
              className="w-full max-w-[168px] self-start"
            />
          )}
          <div className="grid gap-2.5">
            {paso === 0 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">Prepara la muestra y la luz</p>
                <ul className="grid list-disc gap-0.5 pl-4 text-sm text-neutral-600">
                  <li>Trabaja a plena luz natural de mediodía; evita la sombra azulada y las bombillas cálidas.</li>
                  <li>Observa la <strong className="font-semibold">matriz</strong> del suelo, sin raíces ni recubrimientos (no el color de los moteados).</li>
                  <li>Desmenuza un agregado y compara sobre un fondo neutro.</li>
                </ul>
                <div><button type="button" className={BOTON_PRIMARIO} onClick={() => ir(1)}>Empezar</button></div>
              </>
            )}

            {paso === 1 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">¿Determinas el color en húmedo o en seco?</p>
                <p className="text-xs text-neutral-500">El estándar se describe en húmedo. Humedece con unas gotas y espera unos segundos antes de comparar.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={BOTON_OPCION} onClick={() => elegirEstado('humedo')}>Húmedo (referencia)</button>
                  <button type="button" className={BOTON_OPCION} onClick={() => elegirEstado('seco')}>Seco</button>
                </div>
              </>
            )}

            {paso === 2 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">Tono (Hue): ¿en qué página de la carta coincide?</p>
                <p className="text-xs text-neutral-500">Busca primero el matiz del suelo pasando las páginas de la carta Munsell.</p>
                <div className="flex flex-wrap gap-2">
                  {MUNSELL_TONOS.map((h) => (
                    <button key={h} type="button" className={BOTON_CHIP} onClick={() => elegirTono(h)}>{h}</button>
                  ))}
                </div>
              </>
            )}

            {paso === 3 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">Valor (luminosidad): ¿qué fila es la más parecida?</p>
                <p className="text-xs text-neutral-500">De 2 (oscuro) a 8 (claro), dentro del tono {tono}.</p>
                <div className="flex flex-wrap gap-2">
                  {VALORES_COLOR.map((v) => (
                    <button key={v} type="button" className={BOTON_CHIP} onClick={() => elegirValor(v)}>{v}</button>
                  ))}
                </div>
              </>
            )}

            {paso === 4 && (
              <>
                <p className="text-sm font-semibold text-neutral-800">Croma (saturación): ¿qué columna es la más parecida?</p>
                <p className="text-xs text-neutral-500">De 0 (gris) a 8 (color intenso), para {tono} {valor}.</p>
                <div className="flex flex-wrap gap-2">
                  {CROMAS_COLOR.map((c) => (
                    <button key={c} type="button" className={BOTON_CHIP} onClick={() => elegirCroma(c)}>{c}</button>
                  ))}
                </div>
              </>
            )}

            {paso === 5 && completo && (
              <>
                <div className="flex items-center gap-3">
                  {chip && (
                    <span
                      className="h-16 w-16 shrink-0 rounded-sm border border-neutral-300"
                      style={{ background: chip.css }}
                      aria-hidden
                    />
                  )}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Notación Munsell</p>
                    <p className="text-lg font-semibold text-neutral-800">
                      {tono} {valor}/{croma}
                      <span className="ml-2 text-sm font-normal text-neutral-500">({estado ?? 'humedo'})</span>
                    </p>
                    {chip && <p className="text-[11px] text-neutral-500">{chip.etiqueta}</p>}
                  </div>
                </div>
                {lectura && (
                  <p className="text-sm text-neutral-600">
                    <strong className="font-semibold text-neutral-800">{lectura.titulo}.</strong> {lectura.texto}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button type="button" className={BOTON_PRIMARIO} onClick={() => registrar()}>
                    Usar esta notación en la ficha
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {paso > 0 && <button type="button" className={BOTON_GHOST} onClick={() => ir(paso - 1)}>← Paso anterior</button>}
      {valores.colorMunsell && (
        <p className="text-xs text-neutral-500">Registrado en la ficha: <strong className="font-semibold text-neutral-700">{valores.colorMunsell}{valores.colorEstado ? ` (${valores.colorEstado})` : ''}</strong></p>
      )}
      <p className="text-xs text-neutral-500">{ADVERTENCIA_COLOR}</p>
      <p className="text-[11px] text-neutral-400">Fuente: {FUENTES_COLOR[0]}; {FUENTES_COLOR[1]}; {FUENTES_COLOR[2]}.</p>
    </div>
  );
}
