import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { HistorialFichas } from '../componentes/HistorialFichas';
import { PanelEstrategias } from '../componentes/PanelEstrategias';
import { Boton } from '../componentes/ui/Boton';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';

const GraficoPesado = lazy(() => import('../componentes/GraficoDiagnosticoPesado'));

// Paso 4: diagnóstico con gráfico lazy (reduce bundle inicial).
export function DiagnosticoLote() {
  const { predioIdentificador } = usoFlujo();
  const id = predioIdentificador ?? 'finca-mirador';

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Paso 4 · Diagnóstico agroecológico"
        titulo="Diagnóstico del lote"
        descripcion="Interpreta fertilidad y salud del suelo con rangos validados. El sistema sugiere, el técnico decide."
      />
      <Suspense fallback={<p className="mensaje-info">Cargando gráfico…</p>}>
        <GraficoPesado predioIdentificador={id} />
      </Suspense>
      <HistorialFichas predioIdentificador={id} />
      <PanelEstrategias />
      <Link to="/informe"><Boton>Generar informe →</Boton></Link>
    </div>
  );
}
