import { useId } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  AYUDA_VSA, ETIQUETA_VSA, INDICADORES_VSA, OPCIONES_PUNTAJE_VSA, REFERENCIA_LOMBRICES,
  textoLombrices, type IndicadorVsa, type MetaVariableBiologica,
} from '../../datos/biologicas';
import type { EstadoVariable } from '../../datos/variables_suelo';
import { Aviso, CampoNumero, Columna, Fuente, Metodo } from './quimicas_apoyo';
import { IconoBiologico } from './iconos_biologicas';

export { Aviso, CampoNumero, Columna, Fuente, Metodo };

const ETIQUETA_ESTADO: Record<EstadoVariable, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  registrada: 'Registrada',
};

const COLOR_ESTADO: Record<EstadoVariable, string> = {
  pendiente: '#a3a3a3',
  en_progreso: '#f59e0b',
  registrada: '#059669',
};

export function CabeceraVariable({
  meta, estado, avance, paso, total,
}: {
  meta: MetaVariableBiologica;
  estado: EstadoVariable;
  avance: number;
  paso: number;
  total: number;
}) {
  const idTitulo = 'bio-paso-titulo';
  return (
    <header className="grid gap-3 border-b-2 pb-2" style={{ borderColor: meta.color }}>
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 border sm:h-20 sm:w-20" style={{ borderColor: 'var(--borde)' }}>
          <img src={meta.imagen} alt={meta.imagenAlt} loading="lazy" className="h-full w-full object-cover" />
          <span
            className="bio-pulso absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center border-2"
            style={{ background: meta.color, color: '#fff', borderColor: 'var(--sup)' }}
            aria-hidden
          >
            <IconoBiologico id={meta.icono} className="h-4 w-4" />
          </span>
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 id={idTitulo} tabIndex={-1} className="font-display text-xl font-semibold leading-tight text-humus outline-none">{meta.titulo}</h3>
            <span className="mono-micro" style={{ color: 'var(--muted)' }}>
              Paso {paso} de {total} · {ETIQUETA_ESTADO[estado]}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{meta.proposito}</p>
          <div className="flex items-center gap-2">
            <span className="relative h-1.5 flex-1 bg-neutral-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={avance} aria-label={`Avance de ${meta.titulo}`}>
              <span className="absolute inset-y-0 left-0 transition-all duration-500" style={{ width: `${avance}%`, background: meta.color }} />
            </span>
            <span className="numeros text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{avance}%</span>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLOR_ESTADO[estado] }} aria-hidden />
          </div>
        </div>
      </div>
    </header>
  );
}

export function SelloEstado({ etiqueta, hecho }: { etiqueta: string; hecho: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold"
      style={hecho
        ? { borderColor: 'var(--acento)', background: 'var(--acento-suave)', color: 'var(--texto)' }
        : { borderColor: 'var(--borde)', background: 'transparent', color: 'var(--muted)' }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${hecho ? 'bg-[#059669]' : 'bg-neutral-300'}`} aria-hidden />
      {etiqueta}
    </span>
  );
}

export function AnilloAvance({
  valor, etiqueta, detalle,
}: { valor: number; etiqueta: string; detalle?: string }) {
  const radio = 44;
  const perimetro = 2 * Math.PI * radio;
  const avance = (Math.max(0, Math.min(100, valor)) / 100) * perimetro;
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-24 w-24 shrink-0"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
        aria-label={etiqueta}
      >
        <svg viewBox="0 0 112 112" className="h-24 w-24 -rotate-90">
          <circle cx="56" cy="56" r={radio} fill="none" style={{ stroke: 'var(--borde)' }} strokeWidth="10" />
          <circle
            cx="56" cy="56" r={radio} fill="none" style={{ stroke: 'var(--acento)' }} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${avance} ${perimetro}`} className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 grid content-center place-items-center text-center">
          <span className="font-display text-xl leading-none text-humus">{valor}%</span>
        </div>
      </div>
      <div className="grid gap-0.5">
        <p className="text-sm font-semibold text-humus">{etiqueta}</p>
        {detalle && <p className="text-xs leading-relaxed text-neutral-500">{detalle}</p>}
      </div>
    </div>
  );
}

type R = UseFormRegister<FichaSueloFormulario>;
type Nombre = Parameters<R>[0];

export function CampoTexto({
  etiqueta, nombre, registro, placeholder, ayuda, maxLength = 100,
}: {
  etiqueta: string; nombre: Nombre; registro: R;
  placeholder?: string; ayuda?: string; maxLength?: number;
}) {
  const id = useId();
  const descrito = ayuda ? `${id}-ayuda` : undefined;
  return (
    <label className="etiqueta-campo" htmlFor={`${id}-texto`}>
      <span>{etiqueta}</span>
      <input
        id={`${id}-texto`}
        className="campo-entrada"
        type="text"
        maxLength={maxLength}
        placeholder={placeholder}
        aria-describedby={descrito}
        {...registro(nombre)}
      />
      {ayuda && <span id={descrito} className="text-[11px] font-normal text-neutral-500">{ayuda}</span>}
    </label>
  );
}

export function SelectorCategorico({
  etiqueta, opciones, valor, alCambiar, ayuda,
}: {
  etiqueta: string;
  opciones: readonly { valor: string; etiqueta: string; detalle: string }[];
  valor: string | undefined;
  alCambiar: (valor: string | undefined) => void;
  ayuda?: string;
}) {
  return (
    <fieldset className="m-0 grid w-full min-w-0 gap-2 border-0 p-0">
      <legend className="etiqueta-campo p-0">{etiqueta}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {opciones.map((o) => {
          const activo = valor === o.valor;
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => alCambiar(activo ? undefined : o.valor)}
              className={`boton-campo grid content-start gap-1 border p-2.5 text-left text-xs transition-all ${
                activo
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-neutral-200 bg-white hover:border-emerald-600'
              }`}
            >
              <span className="text-sm font-semibold text-humus">{o.etiqueta}</span>
              <span className="leading-snug text-neutral-500">{o.detalle}</span>
            </button>
          );
        })}
      </div>
      {ayuda && <p className="text-[11px] leading-relaxed text-neutral-500">{ayuda}</p>}
    </fieldset>
  );
}

function clasePuntaje(valor: number): string {
  if (valor === 0) return 'border-red-600 bg-red-600 text-white';
  if (valor === 1) return 'border-amber-500 bg-amber-500 text-white';
  return 'border-emerald-600 bg-emerald-600 text-white';
}

export function PuntajeVsa({
  id, valor, alCambiar,
}: { id: IndicadorVsa; valor?: number; alCambiar: (valor: number | undefined) => void }) {
  return (
    <div
      id={`vsa-${id}`}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== '0' && event.key !== '1' && event.key !== '2') return;
        event.preventDefault();
        alCambiar(Number(event.key));
      }}
      className="grid content-start gap-1.5 border border-neutral-200 bg-white p-2.5 outline-none"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-humus">{ETIQUETA_VSA[id]}</p>
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          {valor !== undefined ? `${valor}/2` : 'Sin puntuar'}
        </span>
      </div>
      <p className="text-[11px] leading-snug text-neutral-500">{AYUDA_VSA[id]}</p>
      <div className="grid grid-cols-3 gap-1">
        {OPCIONES_PUNTAJE_VSA.map((o) => {
          const activo = valor === o.valor;
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => alCambiar(activo ? undefined : o.valor)}
              className={`boton-campo min-h-[44px] border px-1 py-1.5 text-center text-[11px] font-semibold transition-all ${
                activo ? clasePuntaje(o.valor) : 'border-neutral-200 bg-white text-neutral-600 hover:border-emerald-600'
              }`}
            >
              {o.etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function posicion(valor: number, minimo: number, maximo: number): number {
  if (maximo <= minimo) return 0;
  return Math.max(0, Math.min(100, ((valor - minimo) / (maximo - minimo)) * 100));
}

export function EscalaLombrices({ valor }: { valor?: number }) {
  const maximo = 50;
  const marcador = valor !== undefined ? posicion(valor, 0, maximo) : null;
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Lombrices por cubo</p>
        <p className="text-2xl font-semibold leading-none text-humus">
          {valor ?? '—'}
          <span className="ml-1 text-sm font-normal text-neutral-500">individuos</span>
        </p>
      </div>
      <div
        className="relative h-4 bg-neutral-100"
        role="img"
        aria-label={`Lombrices por cubo: ${valor ?? 'sin dato'}. Referencia de la guía: menos de 15 pobre, 22 a 28 moderado, más de 35 bueno.`}
      >
        <span className="absolute inset-y-0 left-0 bg-red-600/30" style={{ width: `${posicion(REFERENCIA_LOMBRICES.pobreMax, 0, maximo)}%` }} aria-hidden />
        <span
          className="absolute inset-y-0 bg-amber-500/40"
          style={{
            left: `${posicion(REFERENCIA_LOMBRICES.moderadoMin, 0, maximo)}%`,
            width: `${posicion(REFERENCIA_LOMBRICES.moderadoMax, 0, maximo) - posicion(REFERENCIA_LOMBRICES.moderadoMin, 0, maximo)}%`,
          }}
          aria-hidden
        />
        <span
          className="absolute inset-y-0"
          style={{
            left: `${posicion(REFERENCIA_LOMBRICES.buenoMin, 0, maximo)}%`,
            right: 0,
            background: 'rgba(5, 150, 105, 0.3)',
          }}
          aria-hidden
        />
        {marcador !== null && (
          <span
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 border-2 border-white bg-neutral-900 shadow transition-all duration-500"
            style={{ left: `${marcador}%` }}
            aria-hidden
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] font-medium text-neutral-400" aria-hidden>
        <span>0</span>
        <span>15</span>
        <span>22–28</span>
        <span>35</span>
        <span>50+</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-neutral-500">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 bg-red-600/60" aria-hidden /> Pobre {'<'} 15</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 bg-amber-500/70" aria-hidden /> Moderado 22–28</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2" style={{ background: 'rgba(5, 150, 105, 0.6)' }} aria-hidden /> Bueno {'>'} 35</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 bg-neutral-200" aria-hidden /> Sin clasificar</span>
      </div>
      <p className="text-xs leading-relaxed text-neutral-600">{textoLombrices(valor)}</p>
    </div>
  );
}

export function LecturaCategorica({
  etiqueta, valor, texto,
}: { etiqueta: string; valor?: string; texto: string }) {
  return (
    <div className="grid gap-0.5 border-b border-neutral-100 py-1.5 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{etiqueta}</p>
        <p className="text-sm font-medium text-humus">{valor ?? 'Sin registrar'}</p>
      </div>
      <p className="text-[11px] leading-snug text-neutral-500">{texto}</p>
    </div>
  );
}

export function DesgloseVsa({ puntajes }: { puntajes: Record<string, number> }) {
  return (
    <ul className="grid gap-1.5" aria-label="Puntaje por indicador VSA">
      {INDICADORES_VSA.map((id) => {
        const valor = puntajes[id];
        return (
          <li key={id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_1.5rem] items-center gap-2 text-xs">
            <span className="truncate text-neutral-600">{ETIQUETA_VSA[id]}</span>
            <span className="relative h-1.5 bg-neutral-100" aria-hidden>
              {valor !== undefined && (
                <span className="absolute inset-y-0 left-0 bg-[#14736E] transition-all" style={{ width: `${(valor / 2) * 100}%` }} />
              )}
            </span>
            <span className="text-right font-semibold text-humus">{valor ?? '—'}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ValorSinRango({
  titulo, valor, unidad,
}: { titulo: string; valor?: number; unidad: string }) {
  return (
    <div className="grid content-start gap-1 border border-neutral-200 bg-white p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{titulo}</p>
      <p className="text-lg font-semibold leading-tight text-humus">
        {valor ?? '—'}
        <span className="ml-1 text-xs font-normal text-neutral-500">{unidad}</span>
      </p>
      <span className="w-fit border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] text-neutral-500">
        {valor !== undefined ? 'Sin umbral validado' : 'Sin dato'}
      </span>
    </div>
  );
}
