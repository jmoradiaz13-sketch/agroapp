import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { INDICADORES_VSA, SLIDE_DE_VARIABLE_BIOLOGICA } from '../../datos/biologicas';
import { SLIDE_DE_VARIABLE_QUIMICA } from '../../datos/quimicas';
import {
  TEXTO_ESTADO,
  VARIABLES_POR_CATEGORIA,
  estadoVariable,
  resumenVariables,
  type CategoriaSuelo,
  type EstadoVariable,
  type VariableSuelo,
} from '../../datos/variables_suelo';
import { SLIDE_DE_VARIABLE_FISICA } from './PropiedadesFisicas';

const CONFIG: Record<CategoriaSuelo, {
  titulo: string;
  mapa: Record<string, number>;
  cortos: Record<string, string>;
}> = {
  fisicas: {
    titulo: 'Físico',
    mapa: SLIDE_DE_VARIABLE_FISICA,
    cortos: { textura: 'Textura', color: 'Color', densidad: 'Densidad', agua: 'Agua', estructura: 'Estructura' },
  },
  quimicas: {
    titulo: 'Químico',
    mapa: SLIDE_DE_VARIABLE_QUIMICA,
    cortos: { acidez: 'Acidez', salinidad: 'Sales', materia: 'MO/N', bases: 'Bases', fosforo: 'P/micros' },
  },
  biologicas: {
    titulo: 'Biológico',
    mapa: SLIDE_DE_VARIABLE_BIOLOGICA,
    cortos: { vida: 'Vida', vsa: 'VSA', cobertura: 'Cobertura', laboratorio: 'Lab.' },
  },
};

function avanceDeVariable(
  categoria: CategoriaSuelo,
  variable: VariableSuelo,
  valores: Partial<FichaSueloFormulario>,
  tocadosVsa: number,
): { avance: number; estado: EstadoVariable } {
  if (categoria === 'biologicas' && variable.id === 'vsa') {
    const total = INDICADORES_VSA.length;
    return {
      avance: total ? Math.round((tocadosVsa / total) * 100) : 0,
      estado: tocadosVsa === 0 ? 'pendiente' : tocadosVsa >= total ? 'registrada' : 'en_progreso',
    };
  }
  const resultado = estadoVariable(variable, valores);
  return { avance: resultado.avance, estado: resultado.estado };
}

export function ProgresoFicha({
  categoria,
  diapositiva,
  valores,
  tocadosVsa,
  alIrVariable,
  alIrResumen,
}: {
  categoria: CategoriaSuelo;
  diapositiva: number;
  valores: Partial<FichaSueloFormulario>;
  tocadosVsa: number;
  alIrVariable: (indice: number) => void;
  alIrResumen: () => void;
}) {
  const config = CONFIG[categoria];
  const resumen = resumenVariables(
    categoria,
    valores,
    categoria === 'biologicas'
      ? { vsa: { hechos: tocadosVsa, total: INDICADORES_VSA.length } }
      : undefined,
  );
  const pctCierre = resumen.total ? Math.round((resumen.registradas / resumen.total) * 100) : 0;

  return (
    <nav
      className="grid gap-1 border-b pb-2"
      style={{ borderColor: 'var(--borde)' }}
      aria-label={`Progreso del análisis ${config.titulo.toLowerCase()}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="mono-micro" style={{ color: 'var(--muted)' }}>Progreso · {config.titulo}</p>
        <p className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
          {resumen.registradas} de {resumen.total} variables
        </p>
      </div>
      <div className="flex items-stretch gap-px" role="group" aria-label={`Variables del análisis ${config.titulo.toLowerCase()}`}>
        {VARIABLES_POR_CATEGORIA[categoria].map((variable) => {
          const { avance, estado } = avanceDeVariable(categoria, variable, valores, tocadosVsa);
          const slide = config.mapa[variable.id] ?? 0;
          const activo = diapositiva === slide;
          return (
            <button
              key={variable.id}
              type="button"
              onClick={() => alIrVariable(slide)}
              aria-current={activo ? 'step' : undefined}
              aria-label={`${variable.titulo}: ${TEXTO_ESTADO[estado]}, ${avance}%`}
              title={`${variable.titulo}: ${TEXTO_ESTADO[estado]} (${avance}%)`}
              className="group relative min-h-[44px] min-w-0 flex-1 pb-0.5 pt-3 text-center transition-opacity hover:opacity-75"
            >
              <span
                className="absolute inset-x-0 top-1.5 h-1 overflow-hidden"
                style={{ background: 'var(--borde)' }}
                aria-hidden
              >
                <span
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{
                    width: `${avance}%`,
                    background: estado === 'registrada'
                      ? 'var(--acento)'
                      : estado === 'en_progreso'
                        ? 'var(--terracota)'
                        : 'transparent',
                  }}
                />
              </span>
              <span
                className={`block truncate text-[9px] leading-tight sm:text-[10px] ${activo ? 'font-semibold' : 'font-medium'}`}
                style={{ color: activo ? 'var(--acento)' : 'var(--muted)' }}
              >
                {config.cortos[variable.id] ?? variable.titulo}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={alIrResumen}
          aria-label={`Interpretación: ${resumen.registradas} de ${resumen.total} variables registradas`}
          title={`Interpretación (${resumen.registradas}/${resumen.total})`}
          className="group relative ml-0.5 min-h-[44px] min-w-0 flex-[1.5] pb-0.5 pt-3 text-center transition-opacity hover:opacity-75"
        >
          <span
            className="absolute inset-x-0 top-1.5 h-1 overflow-hidden"
            style={{ background: 'var(--borde)' }}
            aria-hidden
          >
            <span
              className="absolute inset-y-0 left-0 transition-all duration-500"
              style={{
                width: `${pctCierre}%`,
                background: resumen.registradas === resumen.total
                  ? 'var(--acento)'
                  : resumen.registradas > 0
                    ? 'var(--terracota)'
                    : 'transparent',
              }}
            />
          </span>
          <span className="block truncate text-[8px] font-semibold leading-tight sm:text-[10px]" style={{ color: 'var(--acento)' }}>
            Interpretación
          </span>
        </button>
      </div>
    </nav>
  );
}
