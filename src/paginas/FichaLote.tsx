import { Link } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { FichaSueloWizard } from '../componentes/FichaSueloWizard';
import { Boton } from '../componentes/ui/Boton';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';

// Plan plan_fichas_suelo.md: wizard General → Físicas → Químicas → Biológicas → Resumen.
export function FichaLote() {
  const { predioIdentificador } = usoFlujo();
  const id = predioIdentificador ?? 'finca-mirador';

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Paso 3 · Análisis de suelos"
        titulo="Determina las características de tu suelo"
        descripcion="Físicas, químicas y biológicas, en campo y laboratorio. Cada guardado crea una nueva versión con fecha: nunca se sobrescribe."
      />
      <FichaSueloWizard predioIdentificador={id} />
      <Link to="/diagnostico"><Boton>Continuar a diagnóstico →</Boton></Link>
    </div>
  );
}
