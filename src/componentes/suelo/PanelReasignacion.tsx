import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { baseDatos, type FichaSueloLocal, type LoteLocal, type PredioLocal } from '../../base_datos/local';
import { usoFlujo } from '../../estado/usoFlujo';
import { PREDIO_SIN_ASIGNAR } from '../../datos/variables_suelo';
import { EVENTO_FICHAS_ACTUALIZADAS } from '../../servicios/migraciones';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton, BotonSecundario } from '../ui/Boton';

// Fichas antiguas del ámbito 'suelos': se asignan a un predio real o se eliminan.
export function PanelReasignacion() {
  const { fijarPredio } = usoFlujo();
  const [fichas, setFichas] = useState<FichaSueloLocal[]>([]);
  const [predios, setPredios] = useState<PredioLocal[]>([]);
  const [lotes, setLotes] = useState<LoteLocal[]>([]);
  const [destino, setDestino] = useState('');
  const [destinoLote, setDestinoLote] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(async () => {
    const [fs, ps] = await Promise.all([
      baseDatos.fichasSuelo.where('predioIdentificador').equals(PREDIO_SIN_ASIGNAR).toArray(),
      baseDatos.predios.toArray(),
    ]);
    setFichas(fs.sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '')));
    setPredios(ps);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  useEffect(() => {
    if (!destino) {
      setLotes([]);
      setDestinoLote('');
      return;
    }
    let vigente = true;
    void baseDatos.lotes.where('predioIdentificador').equals(destino).toArray()
      .then((ls) => { if (vigente) setLotes(ls); });
    return () => { vigente = false; };
  }, [destino]);

  const asignar = async (ficha: FichaSueloLocal) => {
    if (!destino) { setMensaje('Elige el predio destino antes de asignar.'); return; }
    if (ficha.id === undefined) return;
    const hermanas = await baseDatos.fichasSuelo.where('predioIdentificador').equals(destino).toArray();
    const lote = destinoLote || '';
    const delContexto = hermanas.filter((f) => (f.loteNombre ?? '') === lote);
    const version = Math.max(0, ...delContexto.map((f) => f.version)) + 1;

    await baseDatos.fichasSuelo.update(ficha.id, {
      predioIdentificador: destino,
      loteNombre: destinoLote || undefined,
      version,
      requiereAsignacion: false,
      reasignadaEn: new Date().toISOString(),
      sincronizada: false,
    });
    await baseDatos.fotos.where('fichaId').equals(ficha.id).modify({
      predioIdentificador: destino,
      sincronizada: false,
    });
    await baseDatos.monitoreos.where('fichaId').equals(ficha.id).modify({
      predioIdentificador: destino,
      loteNombre: destinoLote || 'predio',
      sincronizada: false,
    });

    setMensaje(`Ficha v${ficha.version} asignada como v${version}.`);
    await cargar();
    window.dispatchEvent(new Event(EVENTO_FICHAS_ACTUALIZADAS));
    if (fichas.length <= 1) fijarPredio(destino);
  };

  const eliminar = async (ficha: FichaSueloLocal) => {
    if (ficha.id === undefined) return;
    if (!window.confirm(`Eliminar la ficha v${ficha.version} del ${ficha.fecha}? No se puede deshacer.`)) return;
    await baseDatos.fichasSuelo.delete(ficha.id);
    await baseDatos.fotos.where('fichaId').equals(ficha.id).delete();
    await baseDatos.monitoreos.where('fichaId').equals(ficha.id).delete();
    setMensaje('Ficha antigua eliminada.');
    await cargar();
    window.dispatchEvent(new Event(EVENTO_FICHAS_ACTUALIZADAS));
    if (fichas.length <= 1) fijarPredio(predios[0]?.identificador ?? null);
  };

  return (
    <Tarjeta titulo="Fichas sin asignar">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '62ch' }}>
        Estas fichas venían del ámbito antiguo <strong>suelos</strong> y no tienen predio.
        Asígnalas a un predio (y lote, si aplica) para incorporarlas al historial y a la sincronización.
        No se sincronizan mientras sigan sin asignar.
      </p>

      {predios.length === 0 ? (
        <p className="mensaje-info">
          No hay predios. <Link to="/predios" className="font-semibold underline underline-offset-4">Crea uno primero</Link>.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="etiqueta-campo">Predio destino *
            <select className="campo-entrada" value={destino} onChange={(e) => { setDestino(e.target.value); setDestinoLote(''); }}>
              <option value="">— Selecciona —</option>
              {predios.map((p) => <option key={p.id ?? p.identificador} value={p.identificador}>{p.nombre}</option>)}
            </select>
          </label>
          <label className="etiqueta-campo">Lote destino
            <select className="campo-entrada" value={destinoLote} onChange={(e) => setDestinoLote(e.target.value)} disabled={!destino}>
              <option value="">Todo el predio</option>
              {lotes.map((l) => <option key={l.id ?? l.nombre} value={l.nombre}>{l.nombre}</option>)}
            </select>
          </label>
        </div>
      )}

      {mensaje && <p className="mensaje-ok" role="status">{mensaje}</p>}

      {fichas.length === 0 ? (
        <p className="mensaje-info">No quedan fichas sin asignar.</p>
      ) : (
        <ol className="grid gap-2">
          {fichas.map((f) => (
            <li key={f.id ?? `${f.version}-${f.fecha}`} className="grid gap-2 p-3" style={{ border: '1px solid var(--borde)', background: 'var(--sup-2)' }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold" style={{ color: 'var(--acento)' }}>v{f.version}</span>
                <span className="text-sm">{f.fecha}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  Origen: {f.predioAnterior ?? 'suelos'} · {f.loteAnterior ?? f.loteNombre ?? 'general'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Boton onClick={() => void asignar(f)} disabled={!destino}>Asignar al destino</Boton>
                <BotonSecundario onClick={() => void eliminar(f)}>Eliminar</BotonSecundario>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Tarjeta>
  );
}
