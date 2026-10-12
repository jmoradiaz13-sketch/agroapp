import { useEffect, useState } from 'react';
import { baseDatos, type EstrategiaLocal } from '../base_datos/local';
import { BotonSecundario } from './ui/Boton';

// Estrategias con especies demostrativas + estado + decisión técnico.
export function PanelEstrategias() {
  const [items, setItems] = useState<EstrategiaLocal[]>([]);

  const cargar = async () => setItems(await baseDatos.estrategias.toArray());
  useEffect(() => { void cargar(); }, []);

  const avanzar = async (e: EstrategiaLocal) => {
    const orden = ['propuesta', 'aprobada', 'implementada', 'en_monitoreo'] as const;
    const sig = orden[Math.min(orden.indexOf(e.estado) + 1, 3)];
    if (e.id) await baseDatos.estrategias.update(e.id, { estado: sig });
    await cargar();
  };

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold text-humus border-b-2 border-[#059669] pb-2">
        Estrategias productivas ({items.length})
      </h2>
      {items.length === 0 && <p className="mensaje-info">Sin estrategias. Siembra la demo en Predios.</p>}
      {items.map((e) => (
        <article key={e.id} className="bg-white border border-neutral-200 border-l-4 border-l-[#059669] p-4 grid gap-1.5">
          <h3 className="font-semibold text-humus">{e.loteNombre} — {e.tipo} (v{e.version})</h3>
          <p className="text-sm text-neutral-600">Especies: {e.especies.join(', ')}</p>
          <p className="text-sm text-neutral-600">{e.practicas} · Estado: <strong className="text-emerald-700">{e.estado}</strong> · Decisión: {e.decisionTecnico ?? '—'}</p>
          <p className="text-xs italic text-neutral-500">Fuente: {e.referenciaBibliografica}</p>
          <div><BotonSecundario onClick={() => e.id && void avanzar(e)}>Avanzar estado</BotonSecundario></div>
        </article>
      ))}
      <p className="text-xs text-neutral-500">Las especies se definen en el simulador de diseño; el banco de especies se trabajará más adelante.</p>
    </section>
  );
}
