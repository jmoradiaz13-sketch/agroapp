import { Link } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { FichaSueloWizard } from '../componentes/suelo/FichaSueloWizard';
import { Boton } from '../componentes/ui/Boton';

// Escena Suelos = capturar: wizard de 5 pasos. La cabecera la pone MarcoEscena.
export function FichaLote() {
  const { predioIdentificador } = usoFlujo();

  if (!predioIdentificador) {
    return (
      <div className="grid gap-4 animacion-entrada">
        <p className="mensaje-info">Elige o crea un predio para registrar su ficha de suelo.</p>
        <Link to="/predios"><Boton>Ir a Predios</Boton></Link>
      </div>
    );
  }

  return (
    <div className="grid animacion-entrada" style={{ minHeight: 'max(496px, calc(100dvh - 112px))', alignItems: 'center', padding: '8px' }}>
      <FichaSueloWizard predioIdentificador={predioIdentificador} />
    </div>
  );
}
