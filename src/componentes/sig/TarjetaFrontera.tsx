import { useState } from 'react';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import { baseDatos } from '../../base_datos/local';
import { pedirFrontera, type FronteraUpra } from '../../servicios/sig';

// Frontera agrícola UPRA por municipio (dato tabular oficial) + enlace
// honesto a SIPRA para aptitud A1/A2/A3 (Esri, sin API abierta).
export function TarjetaFrontera({ predioId }: { predioId: string }) {
  const [frontera, setFrontera] = useState<FronteraUpra | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const consultar = async () => {
    const predio = (await baseDatos.predios.where('identificador').equals(predioId).toArray())[0];
    if (!predio?.municipio) {
      setMensaje('Registra el municipio del predio para consultar UPRA.');
      return;
    }
    setCargando(true);
    const modo = navigator.onLine ? 'real' : 'demo';
    let resp = await pedirFrontera(predio.municipio, modo);
    if (!resp.ok && modo === 'real') resp = await pedirFrontera(predio.municipio, 'demo');
    setCargando(false);
    if (resp.ok && resp.frontera) {
      setFrontera(resp.frontera);
      setMensaje('');
    } else {
      setMensaje(resp.error ?? 'Sin frontera UPRA.');
    }
  };

  return (
    <Tarjeta titulo="Frontera agrícola (UPRA)">
      <Boton onClick={() => void consultar()} disabled={cargando}>
        {cargando ? 'Consultando…' : 'Consultar frontera'}
      </Boton>
      {mensaje && <p className="mensaje-info">{mensaje}</p>}
      {frontera && (
        <div className="grid gap-1 border border-neutral-200 p-3">
          <p className="text-sm font-semibold">{frontera.municipio} · {frontera.total_ha.toLocaleString('es-CO')} ha en frontera</p>
          <div className="h-3 w-full flex overflow-hidden rounded-sm border border-neutral-200" aria-hidden>
              <span style={{ width: `${(frontera.no_condicionada_ha / frontera.total_ha) * 100}%`, background: '#14736E' }} />
            <span style={{ width: `${(frontera.condicionada_ha / frontera.total_ha) * 100}%`, background: '#f59e0b' }} />
          </div>
          <p className="text-xs text-neutral-600">
            No condicionada {frontera.no_condicionada_ha.toLocaleString('es-CO')} ha · Condicionada {frontera.condicionada_ha.toLocaleString('es-CO')} ha
          </p>
          <p className="text-xs text-neutral-600">{frontera.lectura}</p>
          <p className="text-[11px] italic text-neutral-500">Fuente: {frontera.fuente}</p>
          <a
            href={frontera.aptitud_sipra}
            target="_blank"
            rel="noreferrer"
            className="boton-campo inline-flex items-center px-5 py-2.5 font-semibold text-sm text-emerald-700 underline underline-offset-4"
          >
            Ver aptitud A1/A2/A3 en SIPRA →
          </a>
          <p className="text-[11px] text-neutral-500">{frontera.nota}</p>
        </div>
      )}
    </Tarjeta>
  );
}
