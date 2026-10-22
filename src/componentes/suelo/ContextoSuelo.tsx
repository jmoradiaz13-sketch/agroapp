import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { baseDatos, etiquetaCache, type LoteLocal, type PredioLocal } from '../../base_datos/local';
import { usoFlujo } from '../../estado/usoFlujo';
import { usoPredio } from '../../estado/usoPredio';
import { PREDIO_SIN_ASIGNAR } from '../../datos/variables_suelo';
import { EVENTO_FICHAS_ACTUALIZADAS, migrarFichasSueloAntiguas } from '../../servicios/migraciones';
import { BotonSecundario } from '../ui/Boton';

// Contexto persistente de la sección Suelos: siempre se sabe en qué predio y
// lote se está trabajando. Sin lote, la ficha queda a escala de predio.
export function ContextoSuelo() {
  const { predioIdentificador, loteNombre, fijarPredio, fijarLote } = usoFlujo();
  const { fechaCache } = usoPredio();
  const [predios, setPredios] = useState<PredioLocal[]>([]);
  const [lotes, setLotes] = useState<LoteLocal[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [huerfanas, setHuerfanas] = useState(0);
  const [huerfanasCargadas, setHuerfanasCargadas] = useState(false);

  useEffect(() => {
    let vigente = true;
    void baseDatos.predios.toArray().then((ps) => {
      if (!vigente) return;
      setPredios(ps);
      if (!predioIdentificador && ps[0]) fijarPredio(ps[0].identificador);
    });
    return () => { vigente = false; };
  }, [predioIdentificador, fijarPredio]);

  useEffect(() => {
    if (!predioIdentificador) {
      setLotes([]);
      return;
    }
    let vigente = true;
    void baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).toArray().then((ls) => {
      if (!vigente) return;
      setLotes(ls);
      if (loteNombre && !ls.some((l) => l.nombre === loteNombre)) fijarLote(null);
    });
    return () => { vigente = false; };
  }, [predioIdentificador, loteNombre, fijarLote]);

  useEffect(() => {
    if (!predioIdentificador) {
      setPendientes(0);
      return;
    }
    let vigente = true;
    void baseDatos.fichasSuelo.filter(
      (f) => f.predioIdentificador === predioIdentificador
        && f.predioIdentificador !== PREDIO_SIN_ASIGNAR
        && !f.sincronizada
        && !f.requiereAsignacion
    ).count().then((n) => { if (vigente) setPendientes(n); });
    return () => { vigente = false; };
  }, [predioIdentificador]);

  useEffect(() => {
    let vigente = true;
    const actualizar = () => {
      void baseDatos.fichasSuelo.where('predioIdentificador').equals(PREDIO_SIN_ASIGNAR).count()
        .then((n) => {
          if (!vigente) return;
          setHuerfanas(n);
          setHuerfanasCargadas(true);
        });
    };
    void migrarFichasSueloAntiguas().then(actualizar).catch(actualizar);
    window.addEventListener(EVENTO_FICHAS_ACTUALIZADAS, actualizar);
    return () => { vigente = false; window.removeEventListener(EVENTO_FICHAS_ACTUALIZADAS, actualizar); };
  }, []);

  const predio = predios.find((p) => p.identificador === predioIdentificador);
  const enSinAsignar = predioIdentificador === PREDIO_SIN_ASIGNAR;

  useEffect(() => {
    if (huerfanasCargadas && huerfanas === 0 && predioIdentificador === PREDIO_SIN_ASIGNAR) {
      fijarPredio(null);
    }
  }, [huerfanasCargadas, huerfanas, predioIdentificador, fijarPredio]);

  return (
    <>
    <section
      className="rounded-2xl p-4 sm:p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end animacion-entrada"
      style={{ border: '1px solid var(--borde)', background: 'var(--sup)', boxShadow: 'var(--sombra-suave)' }}
      aria-label="Contexto de trabajo del suelo"
    >
      <label className="etiqueta-campo">Predio
        <select
          className="campo-entrada"
          value={predioIdentificador ?? ''}
          onChange={(e) => fijarPredio(e.target.value || null)}
          aria-label="Predio activo"
        >
          <option value="">— Selecciona un predio —</option>
          {predios.map((p) => <option key={p.id ?? p.identificador} value={p.identificador}>{p.nombre}</option>)}
          {huerfanas > 0 && <option value={PREDIO_SIN_ASIGNAR}>Sin asignar ({huerfanas})</option>}
        </select>
      </label>

      <label className="etiqueta-campo">Lote / parcela
        <select
          className="campo-entrada"
          value={loteNombre ?? ''}
          onChange={(e) => fijarLote(e.target.value || null)}
          disabled={!predioIdentificador || enSinAsignar}
          aria-label="Lote activo"
        >
          <option value="">Todo el predio (sin lote)</option>
          {lotes.map((l) => <option key={l.id ?? l.nombre} value={l.nombre}>{l.nombre}</option>)}
        </select>
      </label>

      <div className="grid gap-1 text-xs lg:pb-2" style={{ color: 'var(--muted)' }}>
        {enSinAsignar ? (
          <>
            <p className="font-semibold" style={{ color: 'var(--texto)' }}>Fichas antiguas sin asignar</p>
            <p>{huerfanas} ficha(s) esperando predio.</p>
            <p>No se sincronizan hasta asignarlas.</p>
          </>
        ) : predio ? (
          <>
            <p className="font-semibold" style={{ color: 'var(--texto)' }}>
              {predio.nombre}{loteNombre ? ` · ${loteNombre}` : ' · ficha de predio'}
            </p>
            {lotes.length === 0 && <p>Sin lotes: la ficha queda a escala de predio.</p>}
            {pendientes > 0 && <p>{pendientes} ficha(s) pendiente(s) de sincronizar</p>}
            <p>{fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'}</p>
          </>
        ) : (
          <p>Selecciona o crea un predio para registrar y leer su suelo. <Link to="/predios" className="font-semibold underline underline-offset-4">Ir a Predios</Link></p>
        )}
      </div>
    </section>
    {huerfanas > 0 && !enSinAsignar && (
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
        style={{ border: '1px solid var(--tierra)', background: 'var(--sup-2)' }}
        role="status"
      >
        <p className="text-sm" style={{ color: 'var(--texto)' }}>
          Hay {huerfanas} ficha(s) antigua(s) sin predio. No se sincronizan hasta asignarlas.
        </p>
        <BotonSecundario type="button" className="ml-auto" onClick={() => fijarPredio(PREDIO_SIN_ASIGNAR)}>
          Revisar fichas
        </BotonSecundario>
      </div>
    )}
    </>
  );
}
