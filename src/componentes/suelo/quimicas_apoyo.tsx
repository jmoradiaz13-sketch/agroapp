import { useId, useState } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { COLOR_SEMAFORO, TEXTO_SEMAFORO } from '../../datos/rangos';
import {
  CATIONES, aNumero, lecturaRango, textoRango, type CationId,
} from '../../datos/quimicas';

type R = UseFormRegister<FichaSueloFormulario>;
type Nombre = Parameters<R>[0];

export function Fuente({ texto }: { texto: string }) {
  return <p className="text-[11px] leading-relaxed text-neutral-500">Fuente: {texto}</p>;
}

export function Columna({
  titulo, className, children,
}: { titulo: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`grid content-start gap-3 border border-neutral-200 bg-white p-3 sm:p-4 ${className ?? ''}`}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">{titulo}</h4>
      {children}
    </section>
  );
}

export function Metodo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="border border-neutral-200 bg-neutral-50">
      <summary className="cursor-pointer p-2.5 text-xs font-semibold text-emerald-700">Método · {titulo}</summary>
      <div className="grid gap-1.5 px-2.5 pb-2.5 text-sm text-neutral-600">{children}</div>
    </details>
  );
}

export function Aviso({ tono = 'info', children }: { tono?: 'info' | 'aviso'; children: React.ReactNode }) {
  const clases = tono === 'aviso'
    ? 'border-amber-300 bg-amber-50 text-amber-800'
    : 'border-neutral-200 bg-neutral-50 text-neutral-600';
  return <p className={`border p-2.5 text-xs leading-relaxed ${clases}`}>{children}</p>;
}

export function CampoNumero({
  etiqueta, unidad, nombre, registro, paso = '0.1', minimo = 0, maximo, placeholder, ayuda, rango,
}: {
  etiqueta: string; unidad: string; nombre: Nombre; registro: R;
  paso?: string; minimo?: number; maximo?: number;
  placeholder?: string; ayuda?: string; rango?: string;
}) {
  const id = useId();
  const descrito = ayuda || rango ? `${id}-ayuda` : undefined;
  return (
    <label className="etiqueta-campo" htmlFor={`${id}-campo`}>
      <span className="flex items-baseline justify-between gap-2">
        <span>{etiqueta}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{unidad}</span>
      </span>
      <input
        id={`${id}-campo`}
        className="campo-entrada"
        type="number"
        inputMode="decimal"
        step={paso}
        min={minimo}
        max={maximo}
        placeholder={placeholder}
        aria-describedby={descrito}
        {...registro(nombre, { valueAsNumber: true })}
      />
      {(ayuda || rango) && (
        <span id={descrito} className="text-[11px] font-normal text-neutral-500">
          {rango ?? ayuda}
          {rango && ayuda ? ` · ${ayuda}` : ''}
        </span>
      )}
    </label>
  );
}

export function CampoSelect({
  etiqueta, nombre, registro, opciones, ayuda,
}: {
  etiqueta: string; nombre: Nombre; registro: R;
  opciones: readonly { valor: string; texto: string }[]; ayuda?: string;
}) {
  const id = useId();
  return (
    <label className="etiqueta-campo" htmlFor={`${id}-select`}>
      <span>{etiqueta}</span>
      <select id={`${id}-select`} className="campo-entrada" defaultValue="" {...registro(nombre)}>
        <option value="">— Sin registrar —</option>
        {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
      {ayuda && <span className="text-[11px] font-normal text-neutral-500">{ayuda}</span>}
    </label>
  );
}

export function SemaforoParametro({
  parametro, valor, compacto = false,
}: { parametro: string; valor: unknown; compacto?: boolean }) {
  const lectura = lecturaRango(parametro, valor);
  if (!lectura) {
    return <span className="text-[11px] font-medium text-neutral-400">Solo registro</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${compacto ? 'text-[11px]' : 'text-xs'}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${COLOR_SEMAFORO[lectura.sem]}`} aria-hidden />
      <span>{TEXTO_SEMAFORO[lectura.sem]}</span>
      <details className="inline">
        <summary className="cursor-pointer text-neutral-500" aria-label={`Fuente del rango de ${parametro}`}>Fuente</summary>
        <span className="mt-1 block max-w-[36ch] text-[10px] font-normal leading-snug text-neutral-500">
          {textoRango(lectura.rango)} · {lectura.rango.fuente}
        </span>
      </details>
    </span>
  );
}

export function CampoBase({
  id, etiqueta, simbolo, nombre, unidad, registro, valor, rango, paso = '0.01',
}: {
  id: CationId; etiqueta: string; simbolo: string; nombre: Nombre; unidad: string;
  registro: R; valor: unknown; rango?: string; paso?: string;
}) {
  const inputId = `base-${id}`;
  return (
    <div className="grid gap-1.5 border border-neutral-200 bg-white p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold text-humus">
          {simbolo} <span className="font-normal text-neutral-500">{etiqueta}</span>
        </label>
        <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{unidad}</span>
      </div>
      <input
        id={inputId}
        className="campo-entrada"
        type="number"
        inputMode="decimal"
        min="0"
        step={paso}
        aria-label={`${etiqueta} en ${unidad}`}
        {...registro(nombre, { valueAsNumber: true })}
      />
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-[11px] text-neutral-500">{rango ?? 'Solo registro'}</span>
        <SemaforoParametro parametro={nombre} valor={valor} compacto />
      </div>
    </div>
  );
}

function posicion(valor: number, minimo: number, maximo: number): number {
  if (maximo <= minimo) return 0;
  return Math.max(0, Math.min(100, ((valor - minimo) / (maximo - minimo)) * 100));
}

export function MedidorLineal({
  titulo, valor, minimo, maximo, optimoMin, optimoMax, unidad, texto, estado,
}: {
  titulo: string; valor?: number; minimo: number; maximo: number;
  optimoMin: number; optimoMax: number; unidad: string; texto?: string; estado?: React.ReactNode;
}) {
  const marcador = valor !== undefined ? posicion(valor, minimo, maximo) : null;
  const bandaInicio = posicion(optimoMin, minimo, maximo);
  const bandaFin = posicion(optimoMax, minimo, maximo);
  const enRango = valor !== undefined && valor >= optimoMin && valor <= optimoMax;
  const marcadorColor = valor === undefined ? '#a3a3a3' : enRango ? '#14736E' : valor < optimoMin ? '#dc2626' : '#f59e0b';

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{titulo}</p>
        {estado}
      </div>
      <p className="text-2xl font-semibold leading-none text-humus">
        {valor !== undefined ? valor : '—'}
        <span className="ml-1 text-sm font-normal text-neutral-500">{unidad}</span>
      </p>
      <div
        className="relative h-3 rounded-full bg-neutral-100"
        role="img"
        aria-label={`${titulo}: ${valor !== undefined ? `${valor} ${unidad}` : 'sin dato'}; referencia ${optimoMin} a ${optimoMax} ${unidad}`}
      >
        <span
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${bandaInicio}%`,
            width: `${Math.max(0, bandaFin - bandaInicio)}%`,
            background: 'rgba(5, 150, 105, 0.25)',
          }}
          aria-hidden
        />
        {marcador !== null && (
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition-all duration-500"
            style={{ left: `${marcador}%`, background: marcadorColor }}
            aria-hidden
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] font-medium text-neutral-400" aria-hidden>
        <span>{minimo}</span>
        <span>Referencia {optimoMin}–{optimoMax}</span>
        <span>{maximo}</span>
      </div>
      {texto && <p className="text-xs leading-relaxed text-neutral-600">{texto}</p>}
    </div>
  );
}

export function EscalaPh({ ph }: { ph?: number }) {
  const marcador = ph !== undefined ? posicion(ph, 0, 14) : null;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Escala de pH</p>
        <p className="text-2xl font-semibold leading-none text-humus">
          {ph !== undefined ? ph : '—'}
          <span className="ml-1 text-sm font-normal text-neutral-500">pH</span>
        </p>
      </div>
      <div
        className="relative h-4 rounded-full"
        style={{ background: 'linear-gradient(90deg,#b91c1c 0%,#dc2626 18%,#f59e0b 38%,#65a30d 50%,#0d9488 62%,#2563eb 100%)' }}
        role="img"
        aria-label={ph !== undefined ? `pH ${ph}` : 'pH sin dato'}
      >
        <span
          className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-900 shadow transition-all duration-500"
          style={{ left: `${marcador ?? 0}%`, opacity: marcador === null ? 0 : 1 }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium text-neutral-400" aria-hidden>
        <span>0 · ácido</span>
        <span>7 · neutro</span>
        <span>14 · alcalino</span>
      </div>
    </div>
  );
}

export function BalanzaCationes({ valores, cic }: { valores: Partial<FichaSueloFormulario>; cic?: number }) {
  const [activo, setActivo] = useState<CationId | null>(null);
  const items = CATIONES.map((c) => ({ ...c, valor: aNumero(valores[c.id]) ?? 0 }));
  const suma = Math.round(items.reduce((a, b) => a + b.valor, 0) * 100) / 100;
  const denominador = Math.max(cic ?? 0, suma, 0.0001);
  const activoItem = items.find((i) => i.id === activo);
  const seleccionable = activoItem && activoItem.valor > 0 ? activoItem : null;

  if (cic === undefined || cic <= 0) {
    return <p className="mensaje-info">Registra la CIC para ver la proporción de cada catión en la capacidad de intercambio.</p>;
  }

  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Ocupación de la CIC</p>
        <p className="text-xs font-medium text-neutral-600">
          {suma} de {cic} cmol/kg · {Math.round((suma / cic) * 1000) / 10} %
        </p>
      </div>
      <div className="flex h-5 w-full overflow-hidden rounded-sm bg-neutral-100" role="img" aria-label="Proporción de cationes sobre la CIC">
        {items.map((c) => c.valor > 0 ? (
          <button
            key={c.id}
            type="button"
            title={`${c.simbolo} ${c.etiqueta}: ${c.valor} cmol/kg`}
            aria-label={`${c.etiqueta}: ${c.valor} cmol/kg`}
            aria-pressed={activo === c.id}
            onMouseEnter={() => setActivo(c.id)}
            onFocus={() => setActivo(c.id)}
            onClick={() => setActivo(c.id)}
            className="h-full min-w-[3px] transition-opacity"
            style={{
              width: `${(c.valor / denominador) * 100}%`,
              background: c.color,
              opacity: activo && activo !== c.id ? 0.45 : 1,
            }}
          />
        ) : null)}
      </div>
      <ul className="grid gap-1">
        {items.map((c) => {
          const pct = Math.round((c.valor / cic) * 1000) / 10;
          const destacado = activo === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActivo(c.id)}
                aria-pressed={destacado}
                className={`boton-campo flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors ${destacado ? 'bg-neutral-100' : ''}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} aria-hidden />
                <span className="font-semibold text-neutral-700">{c.simbolo}</span>
                <span className="text-neutral-500">{c.etiqueta}</span>
                <span className="ml-auto font-medium text-neutral-700">{c.valor} cmol/kg</span>
                <span className="w-12 text-right text-neutral-500">{pct} %</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="min-h-[2.5rem] border-l-2 border-emerald-600 pl-2 text-xs leading-relaxed text-neutral-600" aria-live="polite">
        {seleccionable
          ? `${seleccionable.simbolo} (${seleccionable.etiqueta}): ${seleccionable.valor} cmol/kg, ${Math.round((seleccionable.valor / cic) * 1000) / 10} % de la CIC.`
          : 'Toca un catión de la barra o de la lista para ver su detalle.'}
      </p>
    </div>
  );
}
