import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  FUENTES_BIOLOGICAS, META_BIOLOGICA, REFERENCIA_LOMBRICES, aNumero, avanceVsa, estadoVsa,
  puntajesVsa, valorLaboratorio, valorVida, type FotoCoberturaVista, type ResumenVsa,
} from '../../datos/biologicas';
import {
  VARIABLES_BIOLOGICAS, TEXTO_ESTADO, estadoVariable, resumenVariables, type EstadoVariable,
} from '../../datos/variables_suelo';
import { AnilloAvance, Aviso, Fuente } from './biologicas_apoyo';
import { IconoBiologico } from './iconos_biologicas';

type V = Partial<FichaSueloFormulario>;

const PUNTO: Record<EstadoVariable, string> = {
  pendiente: 'bg-neutral-300',
  en_progreso: 'bg-amber-500',
  registrada: 'bg-[#059669]',
};

function valorClave(id: string, valores: V, vsa: ResumenVsa, foto: FotoCoberturaVista | null): string {
  if (id === 'vida') return valorVida(valores);
  if (id === 'vsa') return vsa.tocados > 0 ? `${vsa.tocados} de ${vsa.total} indicadores` : 'Sin puntuar';
  if (id === 'cobertura') {
    const pct = aNumero(valores.coberturaVegetalPct);
    if (pct !== undefined) return `${pct} % en la ficha`;
    if (foto) return `Foto calculada: ${foto.pct} %`;
    return 'Sin foto ni porcentaje';
  }
  if (id === 'laboratorio') return valorLaboratorio(valores);
  return '';
}

function estadoDe(id: string, valores: V, vsa: ResumenVsa): EstadoVariable {
  if (id === 'vsa') return estadoVsa(vsa);
  const def = VARIABLES_BIOLOGICAS.find((v) => v.id === id);
  return def ? estadoVariable(def, valores).estado : 'pendiente';
}

function avanceDe(id: string, valores: V, vsa: ResumenVsa): number {
  if (id === 'vsa') return avanceVsa(vsa);
  const def = VARIABLES_BIOLOGICAS.find((v) => v.id === id);
  return def ? estadoVariable(def, valores).avance : 0;
}

export function ResumenBiologico({
  valores, puntajes, fotoCobertura, alElegir, alIrResumen,
}: {
  valores: V;
  puntajes: Record<string, number>;
  fotoCobertura: FotoCoberturaVista | null;
  alElegir: (id: string) => void;
  alIrResumen?: () => void;
}) {
  const vsa = puntajesVsa(puntajes);
  const conteosExtra = { vsa: { hechos: vsa.tocados, total: vsa.total } };
  const { registradas, total } = resumenVariables('biologicas', valores, conteosExtra);
  const avance = total === 0 ? 0 : Math.round((registradas / total) * 100);
  const pct = aNumero(valores.coberturaVegetalPct);
  const lombrices = aNumero(valores.lombricesConteo);
  const respiracion = aNumero(valores.respiracionSuelo);
  const biomasa = aNumero(valores.carbonoBiomasa);
  const micorrizas = valores.micorrizas?.trim();
  const avisos: string[] = [];

  if (vsa.tocados > 0 && !vsa.completo) {
    avisos.push(`VSA incompleto: ${vsa.tocados} de ${vsa.total} indicadores puntuados.`);
  }
  if (pct !== undefined && !fotoCobertura) {
    avisos.push('La cobertura está registrada sin foto: no se puede contrastar con el cálculo de la imagen.');
  }
  if (fotoCobertura && pct === undefined) {
    avisos.push('Hay foto de cobertura, pero el porcentaje no se usó en la ficha.');
  }
  if (pct !== undefined && fotoCobertura && Math.abs(pct - fotoCobertura.pct) > 0.5) {
    avisos.push(`La cobertura de la ficha (${pct} %) no coincide con la foto (${fotoCobertura.pct} %).`);
  }
  if (
    lombrices !== undefined
    && ((lombrices >= REFERENCIA_LOMBRICES.pobreMax && lombrices < REFERENCIA_LOMBRICES.moderadoMin)
      || (lombrices > REFERENCIA_LOMBRICES.moderadoMax && lombrices <= REFERENCIA_LOMBRICES.buenoMin))
  ) {
    avisos.push('El conteo de lombrices está en un intervalo no clasificado por la guía (15–21 o 29–35).');
  }
  if (micorrizas !== undefined && micorrizas !== '' && respiracion === undefined && biomasa === undefined) {
    avisos.push('Micorrizas registradas sin respiración ni carbono de biomasa: el bloque de laboratorio queda incompleto.');
  }

  const listo = registradas === total;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 border p-3 sm:grid-cols-[auto_1fr] sm:items-center" style={{ borderColor: 'var(--borde)', background: 'var(--sup-2)' }}>
        <AnilloAvance
          valor={avance}
          etiqueta="Cobertura biológica"
          detalle={`${registradas} de ${total} variables con datos`}
        />
        <div className="grid gap-1">
          <h4 className="font-display text-xl font-medium text-humus">Resumen biológico</h4>
          <p className="text-xs leading-relaxed text-neutral-500">
            La cobertura cuenta variables con al menos un dato. El VSA se valora por indicadores puntuados; el resto se guarda como registro.
          </p>
          <p className={`text-xs font-semibold ${listo ? 'text-emerald-800' : 'text-neutral-600'}`} role="status">
            {listo ? 'Las cuatro variables tienen datos. Revisa la coherencia y guarda la ficha.' : 'Puedes guardar con datos parciales; lo pendiente quedará registrado como faltante.'}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {VARIABLES_BIOLOGICAS.map((v) => {
          const estado = estadoDe(v.id, valores, vsa);
          const avanceVariable = avanceDe(v.id, valores, vsa);
          const meta = META_BIOLOGICA[v.id];
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => alElegir(v.id)}
              className="boton-campo group grid gap-2 border border-neutral-200 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-600"
              aria-label={`Abrir ${v.titulo}: ${TEXTO_ESTADO[estado]}`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center border"
                  style={{ borderColor: meta?.color ?? 'var(--borde)', color: meta?.color ?? 'var(--texto)' }}
                  aria-hidden
                >
                  {meta ? <IconoBiologico id={meta.icono} className="h-4 w-4" /> : null}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-humus">
                    {v.titulo}
                    <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${PUNTO[estado]}`} aria-hidden />
                  </span>
                  <span className="text-[11px] font-medium text-neutral-500">{TEXTO_ESTADO[estado]}</span>
                </span>
              </span>
              <span className="text-sm font-medium text-neutral-700">{valorClave(v.id, valores, vsa, fotoCobertura)}</span>
              <span className="text-[11px] leading-snug text-neutral-500">{v.descripcion}</span>
              <span className="relative h-1 bg-neutral-100" aria-hidden>
                <span className="absolute inset-y-0 left-0 transition-all duration-500" style={{ width: `${avanceVariable}%`, background: meta?.color ?? 'var(--acento)' }} />
              </span>
            </button>
          );
        })}
      </div>

      {avisos.length > 0 && (
        <div className="grid gap-2">
          {avisos.map((a, i) => <Aviso key={`${i}-${a}`} tono="aviso">{a}</Aviso>)}
        </div>
      )}

      <div className="grid gap-1 border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs font-semibold text-neutral-700">Qué falta para completar la lectura biológica</p>
        <ul className="grid gap-1 text-xs leading-relaxed text-neutral-600">
          {VARIABLES_BIOLOGICAS.filter((v) => estadoDe(v.id, valores, vsa) !== 'registrada').map((v) => (
            <li key={v.id}>
              <strong className="font-semibold text-humus">{v.titulo}:</strong> {v.paraConfirmar}
            </li>
          ))}
          {listo && (
            <li>Las cuatro variables tienen datos. Revisa la coherencia y guarda la ficha para conservar la versión.</li>
          )}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-neutral-500">
        El VSA se registra como monitoreo al guardar la ficha. El resto de datos biológicos queda en la ficha versionada con su fecha; no se sobrescribe el historial del lote.
      </p>
      <Fuente texto={`${FUENTES_BIOLOGICAS.vida}; ${FUENTES_BIOLOGICAS.cobertura}; ${FUENTES_BIOLOGICAS.laboratorio}`} />

      {alIrResumen && (
        <div>
          <button
            type="button"
            onClick={alIrResumen}
            className="boton-campo bg-[#059669] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#047857]"
          >
            Ir a la interpretación general
          </button>
        </div>
      )}
    </div>
  );
}
