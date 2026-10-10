import { usoFlujo } from '../estado/usoFlujo';
import { BotonInforme } from '../componentes/BotonInforme';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';

// Paso 5: informe propietario lenguaje claro.
export function InformePredio() {
  const { predioIdentificador } = usoFlujo();
  const id = predioIdentificador ?? 'finca-mirador';
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
    </div>
  );
}
