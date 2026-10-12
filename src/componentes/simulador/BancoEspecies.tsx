import { useState } from 'react';
import { baseDatos, type EspecieLocal } from '../../base_datos/local';
import { sembrarBanco } from '../../servicios/simulador';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton, BotonSecundario } from '../ui/Boton';

const ROLES = [
  'Fijadora de nitrógeno', 'Sombrío', 'Cobertura viva', 'Control biológico',
  'Abono verde', 'Rompevientos', 'Forraje', 'Frutal / ingreso', 'Maderable',
];

// Banco abierto: lista + siembra base + alta del técnico con referencia
// obligatoria (AGENTS.md §2.5, cero invención).
export function BancoEspecies({
  especies, alCambiar,
}: {
  especies: EspecieLocal[];
  alCambiar: () => void;
}) {
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState(false);
  const [comun, setComun] = useState('');
  const [cientifico, setCientifico] = useState('');
  const [rol, setRol] = useState(ROLES[0]);
  const [phMin, setPhMin] = useState('5.0');
  const [phMax, setPhMax] = useState('7.0');
  const [referencia, setReferencia] = useState('');

  const fijar = (campo: string, valor: string) => {
    ({ comun: setComun, cientifico: setCientifico, phMin: setPhMin, phMax: setPhMax, referencia: setReferencia })[campo as 'comun'](valor);
  };

  const agregar = async () => {
    if (!comun.trim()) { setMensaje('El nombre común es obligatorio.'); return; }
    if (!referencia.trim()) { setMensaje('La referencia es obligatoria: nada sin fuente.'); return; }
    await baseDatos.especies.add({
      nombreComun: comun.trim(),
      nombreCientifico: cientifico.trim() || undefined,
      rol,
      phMin: Number(phMin) || undefined,
      phMax: Number(phMax) || undefined,
      referenciaBibliografica: referencia.trim(),
      origen: 'tecnico',
      sincronizada: false,
    });
    setComun(''); setCientifico(''); setReferencia(''); setForm(false);
    setMensaje(`"${comun.trim()}" entra al banco con su fuente.`);
    alCambiar();
  };

  const eliminar = async (e: EspecieLocal) => {
    if (e.id) await baseDatos.especies.delete(e.id);
    alCambiar();
  };

  return (
    <Tarjeta titulo={`Banco de especies (${especies.length})`}>
      <div className="flex gap-2 flex-wrap">
        <BotonSecundario onClick={() => void sembrarBanco().then((m) => { setMensaje(m); alCambiar(); })}>
          🌱 Sembrar banco base
        </BotonSecundario>
        <BotonSecundario onClick={() => setForm((v) => !v)}>{form ? 'Cerrar' : '＋ Agregar especie'}</BotonSecundario>
      </div>
      {mensaje && <p className="mensaje-ok">{mensaje}</p>}
      {form && (
        <div className="grid gap-3 sm:grid-cols-2 border border-neutral-200 p-3">
          <label className="etiqueta-campo">Nombre común *
            <input className="campo-entrada" value={comun} onChange={(e) => fijar('comun', e.target.value)} placeholder="Ej: Chachafruto" />
          </label>
          <label className="etiqueta-campo">Nombre científico
            <input className="campo-entrada" value={cientifico} onChange={(e) => fijar('cientifico', e.target.value)} placeholder="Ej: Erythrina edulis" />
          </label>
          <label className="etiqueta-campo">Rol funcional
            <select className="campo-entrada" value={rol} onChange={(e) => setRol(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="etiqueta-campo">pH min
              <input className="campo-entrada" type="number" step="0.1" value={phMin} onChange={(e) => fijar('phMin', e.target.value)} />
            </label>
            <label className="etiqueta-campo">pH max
              <input className="campo-entrada" type="number" step="0.1" value={phMax} onChange={(e) => fijar('phMax', e.target.value)} />
            </label>
          </div>
          <label className="etiqueta-campo sm:col-span-2">Referencia *
            <input className="campo-entrada" value={referencia} onChange={(e) => fijar('referencia', e.target.value)} placeholder="Ej: manual_de_agroecologia_y_agroforesteria" />
          </label>
          <div className="sm:col-span-2"><Boton onClick={() => void agregar()}>Guardar en el banco</Boton></div>
        </div>
      )}
      <ul className="grid gap-2">
        {especies.map((e) => (
          <li key={e.id} className="border border-neutral-200 p-3 grid gap-1">
            <p className="text-sm font-semibold text-slate-900">
              {e.nombreComun} {e.nombreCientifico ? <span className="font-medium italic text-neutral-500">· {e.nombreCientifico}</span> : null}
              <span className="ml-2 text-[10px] font-bold tracking-wide rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">{e.rol}</span>
            </p>
            <p className="text-[11px] text-neutral-500">
              pH {e.phMin ?? '?'}–{e.phMax ?? '?'} · {e.origen === 'base' ? 'base verificable' : 'técnico'} · Fuente: {e.referenciaBibliografica}
            </p>
            {e.origen === 'tecnico' && (
              <div><button type="button" onClick={() => void eliminar(e)} className="text-xs text-red-700 underline underline-offset-2">Quitar</button></div>
            )}
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}
