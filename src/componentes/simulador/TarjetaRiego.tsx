import { useState } from 'react';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import { CULTIVOS_RIEGO, pedirRiego, type Riego } from '../../servicios/simulador';

// Asistente diario de riego (FertiRIEGO simple): ET×Kc menos lluvia
// efectiva. ETo por Hargreaves con Tmax/Tmin o directa de estación.
export function TarjetaRiego() {
  const [cultivo, setCultivo] = useState('cacao');
  const [lluvia, setLluvia] = useState('2');
  const [tmax, setTmax] = useState('30');
  const [tmin, setTmin] = useState('20');
  const [riego, setRiego] = useState<Riego | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const calcular = async () => {
    setCargando(true);
    const resp = await pedirRiego({
      cultivo,
      lluviaMm: Number(lluvia) || 0,
      tmax: Number(tmax) || undefined,
      tmin: Number(tmin) || undefined,
    });
    setCargando(false);
    if (!resp.ok || !resp.riego) {
      setMensaje(resp.error ?? 'Error al calcular.');
      return;
    }
    setRiego(resp.riego);
    setMensaje('');
  };

  return (
    <Tarjeta titulo="Riego de hoy (balance simple)">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="etiqueta-campo">Cultivo
          <select value={cultivo} onChange={(e) => setCultivo(e.target.value)} className="campo-entrada">
            {CULTIVOS_RIEGO.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="etiqueta-campo">Lluvia últimas 24 h (mm)
          <input className="campo-entrada" type="number" min={0} value={lluvia} onChange={(e) => setLluvia(e.target.value)} />
        </label>
        <label className="etiqueta-campo">Tmax (°C)
          <input className="campo-entrada" type="number" value={tmax} onChange={(e) => setTmax(e.target.value)} />
        </label>
        <label className="etiqueta-campo">Tmin (°C)
          <input className="campo-entrada" type="number" value={tmin} onChange={(e) => setTmin(e.target.value)} />
        </label>
      </div>
      <div><Boton onClick={() => void calcular()} disabled={cargando}>{cargando ? 'Calculando…' : '💧 Calcular lámina'}</Boton></div>
      {mensaje && <p className="mensaje-error">{mensaje}</p>}
      {riego && (
        <div className="grid gap-1 border border-neutral-200 p-3">
          <p className="text-sm">
            Lámina <strong className="font-semibold">{riego.lamina_riego_mm} mm</strong>
            {' '}· ET cultivo {riego.et_cultivo_mm} mm (Kc {riego.kc}) · lluvia efectiva {riego.lluvia_efectiva_mm} mm
          </p>
          <p className="text-xs text-neutral-600">{riego.manejo}</p>
          <p className="text-[11px] italic text-neutral-500">Fuente: {riego.fuente}</p>
        </div>
      )}
    </Tarjeta>
  );
}
