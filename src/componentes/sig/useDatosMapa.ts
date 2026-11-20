import { useCallback, useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import {
  baseDatos,
  type CapaIgacLocal,
  type LoteLocal,
  type PredioLocal,
  type PuntoMuestreoLocal,
} from '../../base_datos/local';
import { usoMapaSIG } from '../../estado/usoMapaSIG';

export function useDatosMapa(
  identificador: string,
  predioProp: PredioLocal | null | undefined,
  alCambiarLotes?: (lotes: LoteLocal[]) => void,
) {
  const [predioLocal, setPredioLocal] = useState<PredioLocal | null>(predioProp ?? null);
  const [lotes, setLotes] = useState<LoteLocal[]>([]);
  const [puntos, setPuntos] = useState<PuntoMuestreoLocal[]>([]);
  const [capasOffline, setCapasOffline] = useState<CapaIgacLocal[]>([]);
  const [enLinea, setEnLinea] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  const cargarLotes = useCallback(async () => {
    const lista = await baseDatos.lotes.where('predioIdentificador').equals(identificador).toArray();
    setLotes(lista);
    const seleccion = usoMapaSIG.getState().loteSeleccionadoId;
    if (seleccion !== null && !lista.some((lote) => lote.id === seleccion)) {
      usoMapaSIG.getState().seleccionarLote(null);
    }
    alCambiarLotes?.(lista);
  }, [identificador, alCambiarLotes]);

  const cargarPuntos = useCallback(async () => {
    setPuntos(await baseDatos.puntosMuestreo.where('predioIdentificador').equals(identificador).toArray());
  }, [identificador]);

  useEffect(() => {
    setPredioLocal(predioProp ?? null);
    if (predioProp) return;
    void baseDatos.predios.where('identificador').equals(identificador).first().then((p) => setPredioLocal(p ?? null));
  }, [identificador, predioProp]);

  useEffect(() => {
    void cargarLotes();
    void cargarPuntos();
  }, [cargarLotes, cargarPuntos]);

  useEffect(() => {
    const suscripcion = liveQuery(() =>
      baseDatos.capasIgac.where('predioIdentificador').equals(identificador).toArray(),
    ).subscribe({ next: setCapasOffline, error: () => setCapasOffline([]) });
    return () => suscripcion.unsubscribe();
  }, [identificador]);

  useEffect(() => {
    const alConectar = () => setEnLinea(true);
    const alDesconectar = () => setEnLinea(false);
    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);
    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, []);

  return {
    predioLocal,
    setPredioLocal,
    lotes,
    puntos,
    capasOffline,
    enLinea,
    cargarLotes,
    cargarPuntos,
  };
}
