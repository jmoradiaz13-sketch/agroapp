import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { baseDatos, type FichaSueloLocal, type MonitoreoLocal } from '../../base_datos/local';
import { construirLecturaSuelo } from '../../servicios/lectura_suelo';
import { TEXTO_ESTADO, type CategoriaSuelo, type EstadoVariable } from '../../datos/variables_suelo';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';

const NOMBRE_CATEGORIA: Record<CategoriaSuelo, string> = {
  fisicas: 'Físicas',
  quimicas: 'Químicas',
  biologicas: 'Biológicas',
};

const CATEGORIAS = ['fisicas', 'quimicas', 'biologicas'] as const;
type VistaMatriz = 'global' | CategoriaSuelo;
const VISTAS: readonly VistaMatriz[] = ['global', ...CATEGORIAS];

const ESTILO_ESTADO: Record<EstadoVariable, { background: string; color: string }> = {
  registrada: { background: 'var(--acento-suave)', color: 'var(--texto)' },
  en_progreso: { background: 'rgba(245, 158, 11, 0.16)', color: 'var(--texto)' },
  pendiente: { background: 'var(--sup-2)', color: 'var(--muted)' },
};

function cargarFicha(
  predioIdentificador: string,
  loteNombre?: string | null,
  versionSeleccionada?: number,
): Promise<{ ficha: FichaSueloLocal | null; monitoreo?: MonitoreoLocal }> {
  return baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).toArray()
    .then(async (fichas) => {
      const delContexto = loteNombre ? fichas.filter((f) => f.loteNombre === loteNombre) : fichas;
      const ordenadas = delContexto.sort((a, b) => b.version - a.version);
      const seleccionada = versionSeleccionada !== undefined
        ? ordenadas.find((f) => f.version === versionSeleccionada)
        : undefined;
      const ficha = seleccionada ?? ordenadas[0] ?? null;
      if (!ficha?.id) return { ficha };
      const monitoreo = await baseDatos.monitoreos.where('fichaId').equals(ficha.id).first();
      return { ficha, monitoreo };
    });
}

export function MatrizSuelo({
  predioIdentificador, loteNombre, versionSeleccionada,
}: {
  predioIdentificador: string;
  loteNombre?: string | null;
  versionSeleccionada?: number;
}) {
  const [ficha, setFicha] = useState<FichaSueloLocal | null>(null);
  const [monitoreo, setMonitoreo] = useState<MonitoreoLocal | undefined>();
  const [mensaje, setMensaje] = useState('Cargando lectura local…');
  const [vista, setVista] = useState<VistaMatriz>('global');

  useEffect(() => {
    let vigente = true;
    setFicha(null);
    setMonitoreo(undefined);
    setVista('global');
    setMensaje('Cargando lectura local…');
    void cargarFicha(predioIdentificador, loteNombre, versionSeleccionada)
      .then((r) => {
        if (!vigente) return;
        setFicha(r.ficha);
        setMonitoreo(r.monitoreo);
        setMensaje(r.ficha ? '' : 'Sin ficha local para este contexto. Registra la primera para leer el suelo.');
      })
      .catch(() => { if (vigente) setMensaje('No se pudo leer el caché local.'); });
    return () => { vigente = false; };
  }, [predioIdentificador, loteNombre, versionSeleccionada]);

  const lectura = useMemo(
    () => (ficha ? construirLecturaSuelo(ficha, monitoreo) : null),
    [ficha, monitoreo]
  );

  if (mensaje) {
    return (
      <Tarjeta titulo="Matriz de evidencia">
        <p className="mensaje-info">{mensaje}</p>
        {!ficha && <Link to="/suelos?vista=ficha"><Boton>Registrar ficha</Boton></Link>}
      </Tarjeta>
    );
  }
  if (!ficha || !lectura) return null;

  const categoriasVisibles = vista === 'global' ? CATEGORIAS : [vista];
  const filasVisibles = lectura.filas.filter((f) => vista === 'global' || f.categoria === vista);
  const hallazgosVisibles = lectura.hallazgos.filter((h) => vista === 'global' || h.categoria === vista);
  const registradasVisibles = filasVisibles.filter((f) => f.estado === 'registrada').length;
  const faltantesVisibles = filasVisibles
    .filter((f) => f.estado !== 'registrada')
    .map((f) => `${f.titulo}${f.estado === 'en_progreso' ? ' (en progreso)' : ''}`);
  const sintesisVisibles = vista === 'global'
    ? lectura.sintesis
    : [
        `${NOMBRE_CATEGORIA[vista]}: ${registradasVisibles} de ${filasVisibles.length} variables registradas.`,
        hallazgosVisibles.length > 0
          ? 'Parámetros con rango validado: '
            + hallazgosVisibles.map((h) => `${h.etiqueta} ${h.valor} ${h.unidad} (${h.texto.toLowerCase()})`).join('; ')
            + '.'
          : 'Sin parámetros con rango validado en esta categoría; la lectura es descriptiva.',
        faltantesVisibles.length > 0
          ? `Pendiente: ${faltantesVisibles.join('; ')}.`
          : 'No faltan variables en esta categoría.',
      ];

  return (
    <div className="grid gap-4">
      <Tarjeta titulo="Síntesis de lectura">
        <p className="text-xs flex flex-wrap items-center gap-2" style={{ color: 'var(--muted)' }}>
          <span>
            Ficha v{ficha.version} · {ficha.fecha} · {ficha.loteNombre ?? 'Todo el predio'}. Lectura local, sin puntaje global.
          </span>
          {versionSeleccionada === ficha.version && (
            <Link to="/suelos?vista=lectura" className="font-semibold underline underline-offset-4">Ver última</Link>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Alcance de la interpretación">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Vista</span>
          {VISTAS.map((opcion) => {
            const activa = vista === opcion;
            return (
              <button
                key={opcion}
                type="button"
                onClick={() => setVista(opcion)}
                aria-pressed={activa}
                className="boton-campo px-3 py-2 text-xs font-semibold rounded-full min-h-[44px]"
                style={activa
                  ? { background: 'var(--marca)', color: 'var(--marca-texto)', border: '1px solid var(--marca)' }
                  : { background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
              >
                {opcion === 'global' ? 'Global' : NOMBRE_CATEGORIA[opcion]}
              </button>
            );
          })}
          {vista !== 'global' && (
            <span className="ml-auto text-[11px]" style={{ color: 'var(--muted)' }}>
              {registradasVisibles}/{filasVisibles.length} registradas
            </span>
          )}
        </div>
        <div className="grid gap-2">
          {sintesisVisibles.map((p) => (
            <p key={p} className="text-sm leading-relaxed" style={{ color: 'var(--texto)' }}>{p}</p>
          ))}
        </div>
        {hallazgosVisibles.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Parámetros con rango validado">
            {hallazgosVisibles.map((h) => (
              <span
                key={h.etiqueta}
                className="text-[11px] font-semibold rounded-full px-2.5 py-1"
                style={{
                  background: h.semaforo === 'optimo' ? 'var(--acento-suave)' : h.semaforo === 'bajo' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(245, 158, 11, 0.16)',
                  color: 'var(--texto)',
                  border: '1px solid var(--borde)',
                }}
              >
                {h.etiqueta}: {h.valor} {h.unidad} · {h.texto}
              </span>
            ))}
          </div>
        )}
        {faltantesVisibles.length > 0 && vista === 'global' && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            Para completar la lectura: {faltantesVisibles.join('; ')}.
          </p>
        )}
      </Tarjeta>

      <Tarjeta titulo="Matriz de evidencia">
        <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: '62ch' }}>
          {vista === 'global'
            ? 'Cada variable muestra si está registrada y qué evidencia aporta. Si no hay umbral validado, se conserva como registro descriptivo.'
            : `Vista de ${NOMBRE_CATEGORIA[vista].toLowerCase()}: evidencia disponible y límites de cada variable registrada.`}
        </p>
        {categoriasVisibles.map((categoria) => {
          const filas = lectura.filas.filter((f) => f.categoria === categoria);
          const conteo = lectura.conteos[categoria];
          return (
            <section key={categoria} className="grid gap-1">
              <h3 className="text-sm font-bold uppercase tracking-wide pt-2" style={{ color: 'var(--acento)' }}>
                {NOMBRE_CATEGORIA[categoria]} · {conteo.registradas}/{conteo.total}
              </h3>
              {filas.map((f) => (
                <article key={f.id} className="grid gap-1 py-2.5" style={{ borderBottom: '1px solid var(--borde)' }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--texto)' }}>{f.titulo}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5" style={ESTILO_ESTADO[f.estado]}>
                      {TEXTO_ESTADO[f.estado]}
                    </span>
                    <span className="ml-auto text-[11px]" style={{ color: 'var(--muted)' }}>{f.conDato}/{f.totalCampos} datos</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.evidencia}</p>
                  {f.estado !== 'pendiente' && (
                    <p className="text-[11px] italic" style={{ color: 'var(--faint)' }}>Fuente: {f.fuente}</p>
                  )}
                </article>
              ))}
            </section>
          );
        })}
      </Tarjeta>
    </div>
  );
}

