import { useEffect, useState } from 'react';
import { baseDatos } from '../base_datos/local';
import { pedirCal, texturaACal, type EnmiendaCal } from '../servicios/enmienda';
import { Tarjeta } from './ui/Tarjeta';
import { Boton } from './ui/Boton';

// Enmienda de cal desde la última ficha: Al + CICE + textura.
// Dosis validada y fraccionada por el servidor (máx 2,5 t/ha por vez).
export function TarjetaEnmienda({ predioIdentificador, loteNombre }: { predioIdentificador: string; loteNombre?: string }) {
  const [enmienda, setEnmienda] = useState<EnmiendaCal | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const [tieneDatos, setTieneDatos] = useState(false);

  useEffect(() => {
    void baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).toArray()
      .then((fs) => {
        const delContexto = loteNombre ? fs.filter((f) => f.loteNombre === loteNombre) : fs;
        const ultima = delContexto.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
        setTieneDatos(!!ultima?.aluminioCmolKg && !!ultima?.cicCmolKg);
      });
  }, [predioIdentificador, loteNombre]);

  const calcular = async () => {
    setCargando(true);
    const fs = await baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).toArray();
    const delContexto = loteNombre ? fs.filter((f) => f.loteNombre === loteNombre) : fs;
    const ultima = delContexto.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    if (!ultima?.aluminioCmolKg || !ultima?.cicCmolKg) {
      setMensaje('La última ficha no trae Al ni CICE: registra el reporte de laboratorio.');
      setCargando(false);
      return;
    }
    const resp = await pedirCal(
      predioIdentificador,
      ultima.aluminioCmolKg,
      ultima.cicCmolKg,
      texturaACal(ultima.texturaTacto),
    );
    setCargando(false);
    if (!resp.ok || !resp.enmienda) {
      setMensaje(resp.error ?? 'Error al calcular.');
      return;
    }
    setEnmienda(resp.enmienda);
    setMensaje('');
  };

  return (
    <Tarjeta titulo="Enmienda de cal (dosis validada)">
      {!tieneDatos ? (
        <p className="mensaje-info">Sin Al/CICE en la última ficha. La dosis se calcula al registrar el laboratorio.</p>
      ) : (
        <>
          <Boton onClick={() => void calcular()} disabled={cargando}>
            {cargando ? 'Calculando…' : 'Calcular dosis de cal'}
          </Boton>
          {mensaje && <p className="mensaje-error">{mensaje}</p>}
          {enmienda && (
            <div className="grid gap-1 border border-neutral-200 p-3">
              <p className="text-sm">
                Dosis <strong className="font-semibold">{enmienda.dosis_t_ha} t/ha</strong>
                {' '}· <span className="font-semibold capitalize">{enmienda.clase}</span>
                {' '}· Sat. Al {enmienda.saturacion_al_pct} %
              </p>
              {enmienda.aplicaciones > 1 && (
                <p className="mensaje-info">
                  Dosis validada: {enmienda.aplicaciones} aplicaciones de {enmienda.dosis_por_aplicacion_t_ha} t/ha (máx 2,5 por vez).
                </p>
              )}
              <p className="text-xs text-neutral-600">{enmienda.manejo}</p>
              <p className="text-[11px] italic text-neutral-500">Fuente: {enmienda.fuente}</p>
            </div>
          )}
        </>
      )}
    </Tarjeta>
  );
}
