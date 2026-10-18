import { useState } from 'react';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  VARIABLES_POR_CATEGORIA, estadoVariable, resumenVariables, TEXTO_ESTADO,
  type CategoriaSuelo, type ConteoExtra, type EstadoVariable, type VariableSuelo,
} from '../../datos/variables_suelo';

const PUNTO_ESTADO: Record<EstadoVariable, string> = {
  pendiente: 'bg-neutral-300',
  en_progreso: 'bg-amber-500',
  registrada: 'bg-[#059669]',
};

function detalle(
  v: VariableSuelo, valores: Partial<FichaSueloFormulario>, conteosExtra?: Record<string, ConteoExtra>,
): { estado: EstadoVariable; avance: number; texto: string } {
  const extra = conteosExtra?.[v.id];
  if (!extra) {
    const e = estadoVariable(v, valores);
    return { estado: e.estado, avance: e.avance, texto: `${e.conDato}/${v.campos.length} datos` };
  }
  const avance = extra.total === 0 ? 0 : Math.round((extra.hechos / extra.total) * 100);
  const estado: EstadoVariable =
    extra.hechos === 0 ? 'pendiente' : extra.hechos >= v.minimoParaRegistrar ? 'registrada' : 'en_progreso';
  return { estado, avance, texto: `${extra.hechos}/${extra.total} puntuados` };
}

// Índice de variables de la categoría: nombre + estado + progreso + acceso directo.
// Desktop: fijo al lado. Móvil: panel desplegable (drawer) para no ocupar espacio.
export function IndiceCategoria({
  categoria, valores, variableActiva, alElegir, conteosExtra,
}: {
  categoria: CategoriaSuelo;
  valores: Partial<FichaSueloFormulario>;
  variableActiva: string | null;
  alElegir: (id: string) => void;
  conteosExtra?: Record<string, ConteoExtra>;
}) {
  const [abierto, setAbierto] = useState(false);
  const variables = VARIABLES_POR_CATEGORIA[categoria] ?? [];
  const { registradas } = resumenVariables(categoria, valores, conteosExtra);

  const lista = (
    <ol className="grid gap-1" aria-label={`Variables de ${categoria}`}>
      {variables.map((v) => {
        const d = detalle(v, valores, conteosExtra);
        const activa = variableActiva === v.id;
        return (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => { alElegir(v.id); setAbierto(false); }}
              aria-current={activa ? 'true' : undefined}
              className="boton-campo w-full text-left px-3 py-2.5 grid gap-1 transition-colors min-h-[44px]"
              style={activa
                ? { background: 'var(--marca)', color: 'var(--marca-texto)' }
                : { background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${PUNTO_ESTADO[d.estado]}`} aria-hidden />
                {v.titulo}
                <span className="ml-auto text-[11px] font-medium opacity-70">{TEXTO_ESTADO[d.estado]}</span>
              </span>
              <span className="relative block h-1 rounded-full bg-neutral-200" aria-hidden>
                <span className="absolute inset-y-0 left-0 rounded-full bg-[#059669] transition-all" style={{ width: `${d.avance}%` }} />
              </span>
              <span className="text-[11px] opacity-70">{d.texto} · {d.avance}%</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="grid gap-2 content-start">
      <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {registradas} de {variables.length} variables registradas
      </p>
      {/* Móvil: botón + drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="boton-campo px-4 py-2 text-sm font-semibold min-h-[44px] w-full"
          style={{ background: 'var(--marca)', color: 'var(--marca-texto)' }}
        >
          {abierto ? 'Cerrar índice ✕' : `Índice de variables (${registradas}/${variables.length}) ▾`}
        </button>
        {abierto && (
          <div role="dialog" aria-label="Índice de variables" className="mt-2 p-2 border" style={{ background: 'var(--sup)', borderColor: 'var(--borde)' }}>
            {lista}
          </div>
        )}
      </div>
      {/* Desktop: fijo */}
      <div className="hidden lg:block">{lista}</div>
    </div>
  );
}
