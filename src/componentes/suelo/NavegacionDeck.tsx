import { useEffect, useRef } from 'react';
import type { IconoBiologicoId } from '../../datos/biologicas';
import type { EstadoVariable } from '../../datos/variables_suelo';
import { IconoBiologico } from './iconos_biologicas';

export interface PasoDeck {
  id: string;
  titulo: string;
  icono: IconoBiologicoId;
  color: string;
  estado: EstadoVariable;
}

const ETIQUETA_ESTADO: Record<EstadoVariable, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  registrada: 'Registrada',
};

const PUNTO_ESTADO: Record<EstadoVariable, string> = {
  pendiente: 'bg-neutral-300',
  en_progreso: 'bg-amber-500',
  registrada: 'bg-[#059669]',
};

function esControlEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export function TiraPasos({
  pasos, actual, alCambiar,
}: { pasos: PasoDeck[]; actual: number; alCambiar: (indice: number) => void }) {
  const completados = pasos.filter((p) => p.id !== 'conclusiones' && p.estado === 'registrada').length;

  return (
    <nav className="grid gap-2" aria-label="Pasos de la sección biológica">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="mono-micro" style={{ color: 'var(--muted)' }}>Recorrido biológico</p>
        <p className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
          {completados} de {pasos.length - 1} variables registradas
        </p>
      </div>
      <ol className="scroll-sutil flex gap-1.5 overflow-x-auto pb-1">
        {pasos.map((paso, i) => {
          const activo = i === actual;
          const hecho = paso.estado === 'registrada';
          return (
            <li key={paso.id} className="shrink-0">
              <button
                type="button"
                onClick={() => alCambiar(i)}
                aria-current={activo ? 'step' : undefined}
                aria-label={`${paso.titulo}: ${ETIQUETA_ESTADO[paso.estado]}`}
                className="boton-campo group grid min-h-[44px] min-w-[92px] grid-cols-[auto_1fr] items-center gap-2 border px-2.5 py-2 text-left transition-all"
                style={activo
                  ? { background: 'var(--marca)', color: 'var(--marca-texto)', borderColor: 'var(--marca)' }
                  : { background: 'var(--sup)', color: 'var(--texto)', borderColor: 'var(--borde)' }}
              >
                <span
                  className="grid h-7 w-7 place-items-center border transition-colors"
                  style={activo
                    ? { borderColor: 'var(--marca-muted)', color: 'var(--marca-texto)' }
                    : { borderColor: paso.color, color: paso.color }}
                >
                  {hecho && !activo
                    ? <span aria-hidden className="text-xs font-bold">✓</span>
                    : <IconoBiologico id={paso.icono} className="h-4 w-4" />}
                </span>
                <span className="grid gap-0.5">
                  <span className="text-[12px] font-semibold leading-tight">{paso.titulo}</span>
                  <span className="flex items-center gap-1 text-[10px] opacity-75">
                    <span className={`h-1.5 w-1.5 rounded-full ${PUNTO_ESTADO[paso.estado]}`} aria-hidden />
                    {ETIQUETA_ESTADO[paso.estado]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PieDeck({
  pasos, actual, alCambiar, alCerrar,
}: {
  pasos: PasoDeck[];
  actual: number;
  alCambiar: (indice: number) => void;
  alCerrar?: () => void;
}) {
  const ultimo = actual === pasos.length - 1;
  const siguiente = pasos[actual + 1];
  const avance = Math.round(((actual + 1) / pasos.length) * 100);
  const cierrePendiente = ultimo && !alCerrar;

  return (
    <div className="grid gap-2 border-t pt-3" style={{ borderColor: 'var(--borde)' }}>
      <div className="flex items-center gap-2" aria-hidden>
        <span className="relative h-1 flex-1 bg-neutral-200">
          <span className="absolute inset-y-0 left-0 bg-[var(--acento)] transition-all duration-500" style={{ width: `${avance}%` }} />
        </span>
        <span className="mono-micro shrink-0" style={{ color: 'var(--muted)' }}>
          {actual + 1}/{pasos.length}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => alCambiar(actual - 1)}
          disabled={actual === 0}
          className="boton-campo inline-flex items-center gap-1.5 border px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: 'transparent', color: 'var(--texto)', borderColor: 'var(--borde)' }}
        >
          <span aria-hidden>←</span> Anterior
        </button>
        <p className="hidden text-[11px] sm:block" style={{ color: 'var(--muted)' }}>
          {ultimo ? 'Cierre de la lectura biológica' : `Sigue: ${siguiente?.titulo ?? ''}`}
        </p>
        <button
          type="button"
          onClick={() => (ultimo ? alCerrar?.() : alCambiar(actual + 1))}
          disabled={cierrePendiente}
          className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: 'var(--marca)', color: 'var(--marca-texto)' }}
        >
          {ultimo ? 'Ir a la interpretación general' : `Siguiente: ${siguiente?.titulo ?? ''}`}
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

export function useNavegacionDeck({
  actual, total, alCambiar, habilitado = true,
}: {
  actual: number;
  total: number;
  alCambiar: (indice: number) => void;
  habilitado?: boolean;
}) {
  const toque = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!habilitado) return;
    const alTeclear = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (esControlEditable(event.target)) return;
      if (event.key === 'ArrowLeft' && actual > 0) {
        event.preventDefault();
        alCambiar(actual - 1);
      }
      if (event.key === 'ArrowRight' && actual < total - 1) {
        event.preventDefault();
        alCambiar(actual + 1);
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [actual, total, alCambiar, habilitado]);

  return {
    alTocarInicio: (event: React.TouchEvent) => {
      if (event.touches.length !== 1 || esControlEditable(event.target)) {
        toque.current = null;
        return;
      }
      toque.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    },
    alTocarFin: (event: React.TouchEvent) => {
      const inicio = toque.current;
      toque.current = null;
      if (!inicio || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - inicio.x;
      const dy = event.changedTouches[0].clientY - inicio.y;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      if (dx < 0 && actual < total - 1) alCambiar(actual + 1);
      if (dx > 0 && actual > 0) alCambiar(actual - 1);
    },
    alCancelarToque: () => { toque.current = null; },
  };
}
