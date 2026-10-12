import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { baseDatos } from '../base_datos/local';
import { usoFlujo } from '../estado/usoFlujo';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';
import { MapaEditor } from '../componentes/MapaEditor';
import { PildorasLote } from '../componentes/PildorasLote';
import { CaracterizacionLote } from '../componentes/CaracterizacionLote';
import { PanelMonitoreo } from '../componentes/PanelMonitoreo';
import { PuntosMuestreo } from '../componentes/PuntosMuestreo';

// Paso 2: dashboard del predio con lotes y mapa único.
export function DashboardLote() {
  const { predioIdentificador, fijarLote } = usoFlujo();
  const [conteo, setConteo] = useState({ lotes: 0, fichas: 0, pendientes: 0 });

  useEffect(() => {
    if (!predioIdentificador) return;
    void (async () => {
      const lotes = await baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).count();
      const fichas = await baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).count();
      const pendientes = await baseDatos.fichasSuelo.filter((f) => !f.sincronizada).count();
      setConteo({ lotes, fichas, pendientes });
    })();
  }, [predioIdentificador]);

  if (!predioIdentificador) {
    return (
      <div className="grid gap-4 animacion-entrada">
        <EncabezadoPagina kicker="Paso 2 · Lotes y mapa" titulo="Lotes del predio" descripcion="Delimita lotes con GPS y caracteriza cada uno." />
        <Tarjeta titulo="Sin predio">
          <Link to="/predios"><Boton>Elige un predio</Boton></Link>
        </Tarjeta>
      </div>
    );
  }
  const resumen = [
    { valor: conteo.lotes, etiqueta: 'Lotes' },
    { valor: conteo.fichas, etiqueta: 'Fichas' },
    { valor: conteo.pendientes, etiqueta: 'Pendientes sync' },
  ];
  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Paso 2 · Lotes y mapa"
        titulo="Lotes del predio"
        descripcion={`Trabajando en ${predioIdentificador}. Dibuja con GPS, mide áreas y caracteriza cada lote offline.`}
      />
      <PildorasLote predioIdentificador={predioIdentificador} />
      <div className="grid grid-cols-3 gap-3">
        {resumen.map((r) => (
          <div key={r.etiqueta} className="bg-selva text-white p-4 text-center grid gap-1">
            <span className="text-2xl font-semibold">{r.valor}</span>
            <span className="text-[10px] font-medium tracking-wide text-white/60">{r.etiqueta}</span>
          </div>
        ))}
      </div>
      <MapaEditor identificador={predioIdentificador} />
      <PuntosMuestreo predioIdentificador={predioIdentificador} />
      <CaracterizacionLote predioIdentificador={predioIdentificador} />
      <PanelMonitoreo />
      <Tarjeta titulo="Siguiente paso">
        <div className="flex gap-2 flex-wrap">
          <Link to="/ficha" onClick={() => fijarLote('general')}><Boton>Ir a ficha</Boton></Link>
          <Link to="/diagnostico" className="boton-campo inline-flex items-center px-5 py-2.5 font-semibold text-sm text-emerald-700 underline underline-offset-4">
            Ver diagnóstico →
          </Link>
        </div>
      </Tarjeta>
    </div>
  );
}
