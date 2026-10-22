import { useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  NODOS, INICIO, PASOS, pasoDeNodo, INFO_CLASE, nombreClase, FUENTES_TEXTURA,
  ADVERTENCIA_TEXTURA, type IlustracionTextura,
} from '../../datos/textura_tacto';
import { ProgresoPasos } from './ProgresoPasos';

const ALT: Record<IlustracionTextura, string> = {
  bola: 'Bola de suelo húmedo de unos 3 cm',
  cinta: 'Formación de una cinta de suelo entre el pulgar y el índice',
  arenoso: 'Tacto áspero con granos de arena',
  harinoso: 'Tacto suave y harinoso propio del limo',
  pegajoso: 'Suelo pegajoso y brillante propio de la arcilla',
};

const BOTON_PRIMARIO =
  'boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors';
const BOTON_OPCION =
  'boton-campo text-left px-4 py-2 text-sm font-semibold rounded-sm bg-white border border-neutral-300 hover:border-[#059669] transition-colors';
const BOTON_GHOST = 'text-xs text-emerald-700 underline underline-offset-2 w-fit';

function Ilustracion({ id }: { id: IlustracionTextura }) {
  return (
    <img
      src={`/imagenes/metodos/textura-${id}.svg`}
      alt={ALT[id]}
      loading="lazy"
      className="w-full max-w-[168px] self-start"
    />
  );
}

// Flujo guiado de determinación de textura al tacto (USDA-NRCS, Thien 1979).
// Cada respuesta avanza el recorrido y, al llegar al resultado, deja la clase
// en el campo texturaTacto de la ficha.
export function FlujoTextura({ fijar, valorActual }: {
  fijar: UseFormSetValue<FichaSueloFormulario>;
  valorActual?: string | null;
}) {
  const [ruta, setRuta] = useState<string[]>([INICIO]);
  const [camino, setCamino] = useState<{ pregunta: string; respuesta: string }[]>([]);
  const actual = ruta[ruta.length - 1];
  const nodo = NODOS[actual];
  const pasoActual = pasoDeNodo(actual);

  const avanzar = (respuesta: string, destino: string) => {
    if (nodo?.tipo === 'pregunta') setCamino((c) => [...c, { pregunta: nodo.titulo, respuesta }]);
    const dest = NODOS[destino];
    if (dest?.tipo === 'resultado') fijar('texturaTacto', nombreClase(dest.clase));
    setRuta((r) => [...r, destino]);
  };

  const atras = () => {
    if (ruta.length <= 1) return;
    setCamino((c) => c.slice(0, -1));
    setRuta((r) => r.slice(0, -1));
  };

  const reiniciar = () => { setCamino([]); setRuta([INICIO]); };

  if (!nodo) return null;

  return (
    <div className="grid gap-3">
      <ProgresoPasos pasos={PASOS} actual={pasoActual} />

      <div className="border border-neutral-200 bg-neutral-50/60 p-3 sm:p-4">
        {nodo.tipo === 'accion' && (
          <div className="grid gap-3 sm:grid-cols-[168px_1fr] sm:items-start">
            <Ilustracion id={nodo.ilustracion} />
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-neutral-800">{nodo.titulo}</p>
              <p className="text-sm text-neutral-600">{nodo.detalle}</p>
              <div>
                <button type="button" className={BOTON_PRIMARIO} onClick={() => avanzar('', nodo.destino)}>
                  Empezar
                </button>
              </div>
            </div>
          </div>
        )}

        {nodo.tipo === 'pregunta' && (
          <div className="grid gap-3 sm:grid-cols-[168px_1fr] sm:items-start">
            <Ilustracion id={nodo.ilustracion} />
            <div className="grid gap-2.5">
              <p className="text-sm font-semibold text-neutral-800">{nodo.titulo}</p>
              <p className="text-xs text-neutral-500">{nodo.ayuda}</p>
              <div className="flex flex-wrap gap-2">
                {nodo.opciones.map((o) => (
                  <button key={o.destino} type="button" className={BOTON_OPCION} onClick={() => avanzar(o.texto, o.destino)}>
                    {o.texto}
                  </button>
                ))}
              </div>
              {ruta.length > 1 && (
                <button type="button" className={BOTON_GHOST} onClick={atras}>← Paso anterior</button>
              )}
            </div>
          </div>
        )}

        {nodo.tipo === 'resultado' && (() => {
          const info = INFO_CLASE[nodo.clase];
          return (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Clase textural</span>
                <span className="rounded-sm bg-[#059669] px-3 py-1 text-base font-semibold text-white">{nombreClase(nodo.clase)}</span>
              </div>
              <p className="text-sm text-neutral-600">{info.lectura}</p>
              <dl className="grid gap-1.5 text-sm sm:grid-cols-3">
                <div className="border border-neutral-200 bg-white p-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Agua disponible</dt>
                  <dd className="font-medium text-neutral-800">{info.agua}</dd>
                </div>
                <div className="border border-neutral-200 bg-white p-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Arcilla</dt>
                  <dd className="font-medium text-neutral-800">{info.arcilla}</dd>
                </div>
                <div className="border border-neutral-200 bg-white p-2.5 sm:col-span-1">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Retención</dt>
                  <dd className="text-neutral-600">{info.aguaTexto}</dd>
                </div>
              </dl>
              <p className="text-sm text-neutral-600"><strong className="font-semibold text-neutral-800">Manejo:</strong> {info.manejo}</p>

              {camino.length > 0 && (
                <details className="border border-neutral-200 bg-white">
                  <summary className="cursor-pointer p-2.5 text-xs font-medium text-emerald-700">Cómo se determinó</summary>
                  <ol className="grid gap-1 px-2.5 pb-2.5 text-xs text-neutral-600">
                    {camino.map((p, i) => (
                      <li key={`${p.pregunta}-${i}`}>
                        <span className="text-neutral-400">{i + 1}.</span> {p.pregunta} <strong className="font-semibold text-neutral-800">→ {p.respuesta}</strong>
                      </li>
                    ))}
                  </ol>
                </details>
              )}

              <div className="flex flex-wrap gap-3">
                <button type="button" className={BOTON_PRIMARIO} onClick={() => fijar('texturaTacto', nombreClase(nodo.clase))}>
                  Usar esta clase en la ficha
                </button>
                <button type="button" className={BOTON_GHOST} onClick={reiniciar}>Repetir la prueba</button>
              </div>
            </div>
          );
        })()}
      </div>

      {valorActual && (
        <p className="text-xs text-neutral-500">Registrado en la ficha: <strong className="font-semibold text-neutral-700">{valorActual}</strong></p>
      )}
      <p className="text-xs text-neutral-500">{ADVERTENCIA_TEXTURA}</p>
      <p className="text-[11px] text-neutral-400">Fuente: {FUENTES_TEXTURA[0]}; {FUENTES_TEXTURA[1]}; {FUENTES_TEXTURA[2]}.</p>
    </div>
  );
}
