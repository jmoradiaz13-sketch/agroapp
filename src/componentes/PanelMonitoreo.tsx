import { useEffect, useState } from 'react';
import { baseDatos, type MonitoreoLocal } from '../base_datos/local';
import { Boton } from './ui/Boton';

// MVP 8: monitoreo con indicadores + observaciones (+ fotos V2 con input file).
export function PanelMonitoreo({ loteNombre = 'general' }: { loteNombre?: string }) {
  const [items, setItems] = useState<MonitoreoLocal[]>([]);
  const [obs, setObs] = useState('');

  const cargar = async () => setItems(await baseDatos.monitoreos.orderBy('fecha').reverse().toArray());
  useEffect(() => { void cargar(); }, []);

  const guardar = async () => {
    await baseDatos.monitoreos.add({
      loteNombre, fecha: new Date().toISOString().slice(0, 10),
      indicadores: { nota_rapida: 1 }, observaciones: obs, sincronizada: false
    });
    setObs('');
    await cargar();
  };

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold text-humus border-b-2 border-[#059669] pb-2">
        Monitoreo ({items.length})
      </h2>
      <div className="bg-white border border-neutral-200 p-4 grid gap-3">
        <label className="etiqueta-campo">Observación rápida
          <input className="campo-entrada" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej: cobertura buena tras lluvias" />
        </label>
        <div><Boton onClick={() => void guardar()}>Guardar monitoreo offline</Boton></div>
      </div>
      <div className="grid gap-2">
        {items.map((m) => (
          <article key={m.id} className="bg-white border border-neutral-200 px-4 py-2.5 text-sm grid gap-0.5">
            <p className="font-semibold text-humus">{m.fecha} — {m.loteNombre}</p>
            <p className="text-neutral-600">{JSON.stringify(m.indicadores)} {m.observaciones ? `— ${m.observaciones}` : ''}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
