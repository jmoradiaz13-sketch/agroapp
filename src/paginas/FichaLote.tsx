import { FichaSueloWizard } from '../componentes/suelo/FichaSueloWizard';
import { TabsSuelos } from '../componentes/suelo/TabsSuelos';
import { AMBITO_SUELOS } from '../datos/variables_suelo';

// Herramienta Suelos · Registrar: caracterización física, química y biológica.
// Se accede desde el Tablero o el menú Suelo. Sin predios ni contextos.
export function FichaLote() {
  return (
    <div className="grid gap-3 animacion-entrada">
      <TabsSuelos />
      <div className="grid animacion-entrada" style={{ minHeight: 'max(496px, calc(100dvh - 112px))', alignItems: 'center', padding: '8px' }}>
        <FichaSueloWizard predioIdentificador={AMBITO_SUELOS} />
      </div>
    </div>
  );
}
