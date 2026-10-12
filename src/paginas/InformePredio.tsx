import { useState } from 'react';
import { usoFlujo } from '../estado/usoFlujo';
import { BotonInforme } from '../componentes/BotonInforme';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { BotonSecundario } from '../componentes/ui/Boton';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';
import { exportarFichasCSV, exportarPredioGeoJSON } from '../servicios/exportacion';

// Paso 5: informe propietario lenguaje claro.
export function InformePredio() {
  const { predioIdentificador } = usoFlujo();
  const id = predioIdentificador ?? 'finca-mirador';
  const [mensaje, setMensaje] = useState('');
  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Paso 5 · Informe final"
        titulo="Informe del predio"
        descripcion="Resumen en lenguaje no técnico: estado de los suelos y estrategias con plan de manejo para el productor."
      />
      <Tarjeta titulo="Contenido del informe">
        <ul className="text-sm text-neutral-600 grid gap-1.5 list-disc ml-5">
          <li>Resumen del predio y sus lotes</li>
          <li>Estado de los suelos en lenguaje claro</li>
          <li>Estrategias agroecológicas con plan de manejo</li>
        </ul>
      </Tarjeta>
      <BotonInforme predioIdentificador={id} />
      <Tarjeta titulo="Exportar datos (investigación)">
        <p className="text-sm text-neutral-600">
          Geometrías en GeoJSON (WGS84) y fichas en CSV con unidades §2.2, generados en tu dispositivo.
        </p>
        {mensaje && <p className="mensaje-ok" role="status">{mensaje}</p>}
        <div className="flex gap-2 flex-wrap">
          <BotonSecundario onClick={() => void exportarPredioGeoJSON(id).then(setMensaje)}>
            ⬇ GeoJSON del predio
          </BotonSecundario>
          <BotonSecundario onClick={() => void exportarFichasCSV(id).then(setMensaje)}>
            ⬇ CSV de fichas
          </BotonSecundario>
        </div>
      </Tarjeta>
    </div>
  );
}
