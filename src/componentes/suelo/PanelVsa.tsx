import { GaugeArco } from '../GaugeArco';
import {
  FUENTES_BIOLOGICAS, INDICADORES_VSA, VSA_MAXIMO, puntajesVsa, textoVsa,
} from '../../datos/biologicas';
import { Aviso, Columna, DesgloseVsa, Fuente, Metodo, PuntajeVsa } from './biologicas_apoyo';

export function PanelVsa({
  puntajes, setPuntajes,
}: { puntajes: Record<string, number>; setPuntajes: (p: Record<string, number>) => void }) {
  const resumen = puntajesVsa(puntajes);
  const siguientePendiente = INDICADORES_VSA.find((id) => puntajes[id] === undefined);

  const cambiar = (id: string, valor: number | undefined) => {
    const copia = { ...puntajes };
    if (valor === undefined) delete copia[id];
    else copia[id] = valor;
    setPuntajes(copia);
  };

  const enfocarSiguiente = () => {
    if (!siguientePendiente) return;
    document.getElementById(`vsa-${siguientePendiente}`)?.focus();
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <Columna titulo="Tarjeta VSA">
        <div className="grid gap-2 sm:grid-cols-2">
          {INDICADORES_VSA.map((id) => (
            <PuntajeVsa
              key={id}
              id={id}
              valor={puntajes[id]}
              alCambiar={(v) => cambiar(id, v)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-neutral-500">
            {resumen.tocados} de {resumen.total} indicadores puntuados. Toca de nuevo la puntuación activa para borrarla; con una tarjeta enfocada puedes usar 0, 1 o 2.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={enfocarSiguiente}
              disabled={!siguientePendiente}
              className="boton-campo border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
              style={{ borderColor: 'var(--borde)', color: 'var(--texto)' }}
            >
              Siguiente sin puntuar
            </button>
            <button
              type="button"
              onClick={() => setPuntajes({})}
              disabled={resumen.tocados === 0}
              className="boton-campo border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
              style={{ borderColor: 'var(--borde)', color: 'var(--muted)' }}
            >
              Limpiar
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2" aria-hidden>
          <span className="relative h-1.5 flex-1 bg-neutral-200">
            <span className="absolute inset-y-0 left-0 bg-[#059669] transition-all duration-500" style={{ width: `${(resumen.tocados / resumen.total) * 100}%` }} />
          </span>
          <span className="mono-micro" style={{ color: 'var(--muted)' }}>{resumen.tocados}/{resumen.total}</span>
        </div>
        <p className="sr-only" aria-live="polite">
          {resumen.tocados} de {resumen.total} indicadores puntuados, suma {resumen.suma}.
        </p>
        <Metodo titulo="Tarjeta VSA 0 · 1 · 2 (Shepherd, VSA Field Guides, FAO 2008)">
          <p>Compara cada indicador con la guía fotográfica: 0 pobre, 1 moderado, 2 bueno. El mismo bloque de 20 cm sirve para estructura, porosidad, color, lombrices, cobertura y erosión visible.</p>
          <p className="text-xs text-neutral-500">La ficha conserva la suma simple de los seis indicadores. La guía VSA también describe una suma ponderada; no se aplica aquí para no alterar la serie histórica.</p>
        </Metodo>
        <Fuente texto={FUENTES_BIOLOGICAS.vsa} />
      </Columna>

      <div className="grid content-start gap-3">
        <Columna titulo="Índice visual">
          <GaugeArco
            valor={resumen.tocados > 0 ? resumen.suma : undefined}
            minimo={0}
            maximo={VSA_MAXIMO}
            titulo={`VSA · ${resumen.tocados}/${resumen.total}`}
            subtexto={
              resumen.tocados === 0
                ? 'Sin indicadores puntuados'
                : resumen.completo
                  ? 'Suma simple de seis indicadores'
                  : `${resumen.tocados} de ${resumen.total} indicadores`
            }
            color="#14736E"
          />
          <DesgloseVsa puntajes={puntajes} />
          <p className="text-xs leading-relaxed text-neutral-600">{textoVsa(resumen)}</p>
          <Aviso tono="info">
            La suma simple no se reclasifica como pobre, moderada o buena: la guía usa ponderadores y umbrales que no coinciden con estos seis indicadores.
          </Aviso>
          <p className="text-xs leading-relaxed text-neutral-500">
            Al guardar la ficha, los puntajes se registran como monitoreo VSA. El índice porcentual solo se calcula cuando los seis indicadores están puntuados; no se sobrescribe el historial del lote.
          </p>
          <Fuente texto={FUENTES_BIOLOGICAS.vsa} />
        </Columna>
      </div>
    </div>
  );
}
