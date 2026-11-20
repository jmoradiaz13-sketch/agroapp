import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { baseDatos } from '../base_datos/local';
import { FichaSueloWizard } from '../componentes/suelo/FichaSueloWizard';
import { PanelReasignacion } from '../componentes/suelo/PanelReasignacion';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { Boton } from '../componentes/ui/Boton';
import { PREDIO_SIN_ASIGNAR } from '../datos/variables_suelo';

// Sección única Suelos. El contexto (predio/lote) manda sobre captura y lectura.
export function PaginaSuelos() {
  const [params] = useSearchParams();
  const vistaParam = params.get('vista');
  const vista = vistaParam === 'lectura' ? 'lectura' : vistaParam === 'fichas' ? 'fichas' : 'ficha';
  const versionCruda = Number(params.get('version'));
  const versionSeleccionada = Number.isInteger(versionCruda) && versionCruda > 0 ? versionCruda : undefined;
  const { predioIdentificador, loteNombre, fijarPredio } = usoFlujo();
  const enSinAsignar = predioIdentificador === PREDIO_SIN_ASIGNAR;

  useEffect(() => {
    if (predioIdentificador) return;
    void baseDatos.predios.toArray().then((ps) => {
      if (ps[0]) fijarPredio(ps[0].identificador);
    });
  }, [predioIdentificador, fijarPredio]);

  return (
    <div className="grid gap-3 animacion-entrada">
      {enSinAsignar ? (
        <PanelReasignacion />
      ) : (
        <>
          {!predioIdentificador ? (
            <Tarjeta titulo="Elige un predio para continuar">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Las fichas de suelo siempre pertenecen a un predio. El lote es opcional.
              </p>
              <div>
                <Link to="/predios"><Boton>Ir a Predios</Boton></Link>
              </div>
            </Tarjeta>
          ) : (
            <div className="grid animacion-entrada" style={{ minHeight: 'max(496px, calc(100dvh - 112px))', alignItems: 'center', padding: '8px' }}>
              <FichaSueloWizard
                key={`${predioIdentificador}:${loteNombre ?? ''}:${vista}:${versionSeleccionada ?? ''}`}
                predioIdentificador={predioIdentificador}
                loteNombre={loteNombre ?? undefined}
                vistaInicial={vista}
                versionInicial={versionSeleccionada}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
