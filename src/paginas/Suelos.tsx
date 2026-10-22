import { Link, useSearchParams } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { ContextoSuelo } from '../componentes/suelo/ContextoSuelo';
import { TabsSuelos } from '../componentes/suelo/TabsSuelos';
import { FichaSueloWizard } from '../componentes/suelo/FichaSueloWizard';
import { LecturaSuelo } from '../componentes/suelo/LecturaSuelo';
import { PanelReasignacion } from '../componentes/suelo/PanelReasignacion';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { PREDIO_SIN_ASIGNAR } from '../datos/variables_suelo';

// Sección única Suelos. El contexto (predio/lote) manda sobre captura y lectura.
export function PaginaSuelos() {
  const [params] = useSearchParams();
  const vista = params.get('vista') === 'lectura' ? 'lectura' : 'ficha';
  const versionCruda = Number(params.get('version'));
  const versionSeleccionada = Number.isInteger(versionCruda) && versionCruda > 0 ? versionCruda : undefined;
  const { predioIdentificador, loteNombre } = usoFlujo();
  const enSinAsignar = predioIdentificador === PREDIO_SIN_ASIGNAR;

  return (
    <div className="grid gap-3 animacion-entrada">
      <ContextoSuelo />
      {enSinAsignar ? (
        <PanelReasignacion />
      ) : (
        <>
          <TabsSuelos />
          {!predioIdentificador ? (
            <Tarjeta titulo="Elige un predio para continuar">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Las fichas de suelo siempre pertenecen a un predio. El lote es opcional.
              </p>
              <div>
                <Link to="/predios"><Boton>Ir a Predios</Boton></Link>
              </div>
            </Tarjeta>
          ) : vista === 'ficha' ? (
            <div className="grid animacion-entrada" style={{ minHeight: 'max(496px, calc(100dvh - 112px))', alignItems: 'center', padding: '8px' }}>
              <FichaSueloWizard
                key={`${predioIdentificador}:${loteNombre ?? ''}`}
                predioIdentificador={predioIdentificador}
                loteNombre={loteNombre ?? undefined}
              />
            </div>
          ) : (
            <LecturaSuelo predioIdentificador={predioIdentificador} loteNombre={loteNombre} versionSeleccionada={versionSeleccionada} />
          )}
        </>
      )}
    </div>
  );
}
