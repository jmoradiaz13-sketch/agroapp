import { useEffect, useState } from 'react';
import { baseDatos } from '../base_datos/local';
import { BotonSecundario } from './ui/Boton';

// Puntos de muestreo GPS con ID único (protocolo estilo TSIP simplificado).
export function PuntosMuestreo({ predioIdentificador }: { predioIdentificador: string }) {
  const [puntos, setPuntos] = useState<{ codigo: string; lat: number; lng: number; fecha: string }[]>([]);
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    const lista = await baseDatos.puntosMuestreo.where('predioIdentificador').equals(predioIdentificador).toArray();
    setPuntos(lista.map((p) => ({ codigo: p.codigo, lat: p.lat, lng: p.lng, fecha: p.fecha })));
  };
  useEffect(() => { void cargar(); }, [predioIdentificador]);

  const marcar = () => {
    if (!navigator.geolocation) { setMensaje('GPS no disponible en este dispositivo.'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const fecha = new Date().toISOString().slice(0, 10);
        const n = (await baseDatos.puntosMuestreo.where('predioIdentificador').equals(predioIdentificador).count()) + 1;
        const codigo = `MU-${fecha.replace(/-/g, '')}-${String(n).padStart(2, '0')}`;
        await baseDatos.puntosMuestreo.add({
          predioIdentificador, codigo,
          lat: Math.round(pos.coords.latitude * 100000) / 100000,
          lng: Math.round(pos.coords.longitude * 100000) / 100000,
          fecha, sincronizada: false,
        });
        setMensaje(`Punto ${codigo} guardado offline.`);
        await cargar();
      },
      () => setMensaje('No se pudo obtener la posición GPS.')
    );
  };

  return (
    <section className="bg-white border border-neutral-200 p-4 grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#141414]">Puntos de muestreo ({puntos.length})</h3>
        <BotonSecundario onClick={marcar}>◎ Marcar punto GPS</BotonSecundario>
      </div>
      {mensaje && <p className="mensaje-ok">{mensaje}</p>}
      {puntos.length === 0 ? (
        <p className="text-xs text-neutral-500">Sin puntos. Marca el primero donde tomarás la muestra.</p>
      ) : (
        <ol className="grid gap-1.5">
          {puntos.map((p) => (
            <li key={p.codigo} className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm border-b border-neutral-100 py-1.5">
              <strong className="font-semibold text-[#1b5e20]">{p.codigo}</strong>
              <span className="text-neutral-500">{p.lat}, {p.lng}</span>
              <span className="text-neutral-400 text-xs self-center">{p.fecha}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
