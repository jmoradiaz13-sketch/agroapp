import { useEffect, useState } from 'react';
import { baseDatos } from '../base_datos/local';
import { PREDIO_SIN_ASIGNAR } from '../datos/variables_suelo';

// Banner de conectividad: SOLO visible sin red (ámbar). Con red no estorba:
// el estado de sync vive en el sidebar (PC). En campo avisa que todo
// queda guardado local en Dexie.
export function BannerOffline() {
  const [enLinea, setEnLinea] = useState(true);
  const [pendientes, setPendientes] = useState(0);

  const contar = async () => {
    const [fichas, fotos, lotes, puntos] = await Promise.all([
      baseDatos.fichasSuelo.filter(
        (f) => !f.sincronizada && !f.requiereAsignacion && f.predioIdentificador !== PREDIO_SIN_ASIGNAR
      ).count(),
      baseDatos.fotos.filter(
        (f) => !f.sincronizada && f.predioIdentificador !== PREDIO_SIN_ASIGNAR
      ).count(),
      baseDatos.lotes.filter((l) => (l.estadoSincronizacion ?? 'pendiente') !== 'sincronizado').count(),
      baseDatos.puntosMuestreo.filter((p) => !p.sincronizada).count(),
    ]);
    setPendientes(fichas + fotos + lotes + puntos);
  };

  useEffect(() => {
    setEnLinea(navigator.onLine);
    void contar();
    const on = () => setEnLinea(true);
    const off = () => setEnLinea(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const id = window.setInterval(() => void contar(), 30000);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.clearInterval(id);
    };
  }, []);

  if (enLinea) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950"
    >
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-950" aria-hidden />
        MODO OFFLINE · guardado local en Dexie · {pendientes} pendientes
      </span>
    </div>
  );
}
