import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { usoPredio } from '../estado/usoPredio';
import { HistorialFichas } from '../componentes/HistorialFichas';
import { PanelEstrategias } from '../componentes/PanelEstrategias';
import { TarjetaEnmienda } from '../componentes/TarjetaEnmienda';
import { SimuladorRusle } from '../componentes/SimuladorRusle';
import { AyudaCampo } from '../componentes/AyudaCampo';
import { Boton } from '../componentes/ui/Boton';
import { etiquetaCache } from '../base_datos/local';

const GraficoPesado = lazy(() => import('../componentes/GraficoDiagnosticoPesado'));

// Escena Diagnóstico = interpretar y decidir. La cabecera la pone MarcoEscena.
export function DiagnosticoLote() {
  const { predioIdentificador } = usoFlujo();
  const { fechaCache } = usoPredio();

  if (!predioIdentificador) {
    return (
      <div className="grid gap-4 animacion-entrada">
        <p className="mensaje-info">Elige o crea un predio para ver su diagnóstico.</p>
        <Link to="/predios"><Boton>Ir a Predios</Boton></Link>
      </div>
    );
  }

  const id = predioIdentificador;

  return (
    <div className="grid gap-4 animacion-entrada">
      <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: '62ch' }}>
        Salud 0-100 trazable, erosión RUSLE y enmiendas. El sistema sugiere, el técnico decide.
      </p>
      <p className="text-[11px]" style={{ color: 'var(--faint)' }}>{fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'}</p>
      <Suspense fallback={<p className="mensaje-info">Cargando gráfico…</p>}>
        <GraficoPesado predioIdentificador={id} />
      </Suspense>
      <HistorialFichas predioIdentificador={id} />
      <SimuladorRusle predioIdentificador={id} />
      <TarjetaEnmienda predioIdentificador={id} />
      <PanelEstrategias />
      <AyudaCampo
        titulo="Aprende en campo: pH, MO y Al"
        porque="El pH bajo bloquea nutrientes y el aluminio alto es tóxico para raíces; la MO amortigua ambos."
        como="Si Al/CICE supera la meta, fracciona la cal en 2,5 t/ha cada 60 días con MO y re-muestrea a los 6 meses."
        fuente="guia_de_buenas_practicas_para_la_gestion_y_uso_sostenible_de_los_suelos"
      />
      <Link to="/informe"><Boton>Generar informe</Boton></Link>
    </div>
  );
}
