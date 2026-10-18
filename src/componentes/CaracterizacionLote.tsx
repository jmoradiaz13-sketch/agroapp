import { useEffect, useState } from 'react';
import { baseDatos, type LoteLocal } from '../base_datos/local';

// MVP 2-4: lotes + biofísica + usos, editable offline.
export function CaracterizacionLote({ predioIdentificador }: { predioIdentificador: string }) {
  const [lotes, setLotes] = useState<LoteLocal[]>([]);

  useEffect(() => {
    void baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).toArray().then(setLotes);
  }, [predioIdentificador]);

  const guardarCampo = async (id: number | undefined, campo: keyof LoteLocal, valor: string) => {
    if (!id) return;
    await baseDatos.lotes.update(id, { [campo]: valor, fechaActualizacion: new Date().toISOString() } as Partial<LoteLocal>);
    setLotes(await baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).toArray());
  };

  if (lotes.length === 0) return <p className="mensaje-info">Sin lotes. Dibuja el primero en el mapa.</p>;
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold text-humus border-b-2 border-[#059669] pb-2">
        Lotes y caracterización biofísica ({lotes.length})
      </h2>
      {lotes.map((l) => (
        <article key={l.id} className="bg-white border border-neutral-200 border-l-4 border-l-[#059669] p-4 grid gap-3">
          <h3 className="font-semibold text-humus">{l.nombre} — {l.areaHa ?? '?'} ha</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="etiqueta-campo">Uso actual
              <input className="campo-entrada" defaultValue={l.usoActual ?? ''} onBlur={(e) => void guardarCampo(l.id, 'usoActual', e.target.value)} />
            </label>
            <label className="etiqueta-campo">Cobertura
              <input className="campo-entrada" defaultValue={l.cobertura ?? ''} onBlur={(e) => void guardarCampo(l.id, 'cobertura', e.target.value)} />
            </label>
            <label className="etiqueta-campo">Clima
              <input className="campo-entrada" defaultValue={l.clima ?? ''} onBlur={(e) => void guardarCampo(l.id, 'clima', e.target.value)} />
            </label>
            <label className="etiqueta-campo">Zona de vida
              <input className="campo-entrada" defaultValue={l.zonaVida ?? ''} onBlur={(e) => void guardarCampo(l.id, 'zonaVida', e.target.value)} />
            </label>
            <label className="etiqueta-campo">Erosión
              <input className="campo-entrada" defaultValue={l.erosion ?? ''} onBlur={(e) => void guardarCampo(l.id, 'erosion', e.target.value)} />
            </label>
            <label className="etiqueta-campo">Notas
              <input className="campo-entrada" defaultValue={l.notas ?? ''} onBlur={(e) => void guardarCampo(l.id, 'notas', e.target.value)} />
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            Históricos: {(l.usosHistoricos ?? []).join(', ') || '—'} · Pendiente: {l.pendientePct ?? '?'}% · Sync: {l.estadoSincronizacion ?? 'pendiente'}
          </p>
        </article>
      ))}
    </section>
  );
}
