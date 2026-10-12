import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { usoPredio } from '../estado/usoPredio';
import { baseDatos, etiquetaCache, type EscenarioLocal, type FichaSueloLocal, type LoteLocal, type PredioLocal } from '../base_datos/local';
import { RANGOS_VALIDADOS, semaforoPara } from '../datos/rangos';
import type { Hallazgo } from '../esquemas/diagnostico';
import { calcularMadurez, type Madurez } from '../servicios/madurez';
import { MedidorRadial } from '../componentes/MedidorRadial';
import { MiniMapa } from '../componentes/MiniMapa';

const ACCESOS = [
  { titulo: 'Analizar suelo', subtitulo: 'Ficha VSA + laboratorio', ruta: '/ficha', imagen: '/imagenes/3.jpg' },
  { titulo: 'Mapa SIG', subtitulo: 'IGAC, pendiente y NDVI', ruta: '/sig', imagen: '/imagenes/5.jpg' },
  { titulo: 'Simular sistema', subtitulo: 'Escenarios A/B/C', ruta: '/simulador', imagen: '/imagenes/4.jpg' },
  { titulo: 'Biblioteca', subtitulo: 'Aprende en campo', ruta: '/biblioteca', imagen: '/imagenes/1.jpg' },
];

// Dashboard (ref_1): resumen de la finca activa + suelo + lotes + plan,
// con datos reales de Dexie. En móvil se apila; en PC es grilla.
export function PaginaInicio() {
  const navegar = useNavigate();
  const { fechaCache } = usoPredio();
  const { predioIdentificador, fijarPredio } = usoFlujo();
  const [predios, setPredios] = useState<PredioLocal[]>([]);
  const [lotes, setLotes] = useState<LoteLocal[]>([]);
  const [ficha, setFicha] = useState<FichaSueloLocal | null>(null);
  const [conteoPlan, setConteoPlan] = useState({ escenarios: 0, disenos: 0 });
  const [madurez, setMadurez] = useState<Madurez | null>(null);
  const [escenarios, setEscenarios] = useState<EscenarioLocal[]>([]);

  useEffect(() => {
    void baseDatos.predios.toArray().then((ps) => {
      setPredios(ps);
      if (!predioIdentificador && ps[0]) fijarPredio(ps[0].identificador);
    });
    void calcularMadurez().then(setMadurez);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!predioIdentificador) return;
    void baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).toArray().then(setLotes);
    void baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).toArray()
      .then((fs) => setFicha(fs.sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null));
    void Promise.all([
      baseDatos.escenarios.where('predioIdentificador').equals(predioIdentificador).count(),
      baseDatos.disenos.where('predioIdentificador').equals(predioIdentificador).count(),
      baseDatos.escenarios.where('predioIdentificador').equals(predioIdentificador).toArray(),
    ]).then(([escenarios, disenos, lista]) => {
      setConteoPlan({ escenarios, disenos });
      setEscenarios(lista.slice(-3).reverse());
    });
  }, [predioIdentificador]);

  const predio = predios.find((p) => p.identificador === predioIdentificador) ?? predios[0];
  const areaLotes = lotes.reduce((a, l) => a + (l.areaHa ?? 0), 0);

  // Soil Health Score local (ref_1): % de parámetros en óptimo, sin backend.
  const { hallazgos, score, etiquetaScore } = useMemo(() => {
    if (!ficha) return { hallazgos: [] as Hallazgo[], score: 0, etiqueta: '' };
    const hs: Hallazgo[] = [];
    for (const r of RANGOS_VALIDADOS) {
      const v = ficha[r.parametro as keyof FichaSueloLocal];
      if (typeof v !== 'number' || Number.isNaN(v)) continue;
      const sem = semaforoPara(r, v);
      if (sem === 'sin-dato') continue;
      hs.push({
        parametro: r.etiqueta,
        unidad: r.unidad,
        valor: v,
        estado: sem === 'bajo' ? 'deficiente' : sem === 'alto' ? 'exceso' : 'optimo',
        porque: `${r.etiqueta}: ${v} ${r.unidad} (óptimo ${r.optimoMin}–${r.optimoMax}).`,
        referenciaBibliografica: r.fuente,
      });
    }
    const optimos = hs.filter((h) => h.estado === 'optimo').length;
    const sc = hs.length === 0 ? 0 : Math.round((optimos / hs.length) * 100);
    const etiqueta = sc >= 80 ? 'excelente' : sc >= 60 ? 'bueno' : sc >= 40 ? 'moderado' : 'crítico';
    return { hallazgos: hs, score: sc, etiquetaScore: etiqueta };
  }, [ficha]);

  return (
    <div className="grid gap-4 animacion-entrada">
      {/* Resumen de la finca activa */}
      <section className="glass rounded-2xl p-5 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center" aria-label="Resumen de la finca">
        <div className="grid gap-1">
          <p className="text-[11px] font-bold tracking-widest text-emerald-300/80">
            FINCA ACTIVA · {conteoPlan.escenarios + conteoPlan.disenos > 0 ? 'PLANIFICACIÓN ACTIVA' : 'SIN PLAN AÚN'}
          </p>
          <h2 className="font-display text-3xl lg:text-5xl font-semibold text-white leading-tight">{predio?.nombre ?? 'Sin predios'}</h2>
          <p className="text-xs text-white/60">
            {[predio?.municipio, predio?.departamento].filter(Boolean).join(', ') || 'Ubicación sin registrar'}
            {' '}· {predio?.areaTotalHa ?? areaLotes.toFixed(1)} ha · {lotes.length} lotes · {ficha ? `ficha v${ficha.version}` : 'sin ficha'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navegar(predio ? '/lote' : '/predios')} className="boton-campo bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-sm text-sm hover:bg-emerald-700 transition-colors">
            {predio ? 'Abrir lotes →' : '＋ Crear predio'}
          </button>
          <button onClick={() => navegar('/predios')} className="boton-campo bg-white/10 text-white font-semibold px-6 py-2.5 rounded-sm text-sm border border-white/25 hover:bg-white/15 transition-colors">
            Cambiar finca
          </button>
        </div>
      </section>

      {/* Suelo + progreso + lotes + plan */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Estado de la finca">
        <article className="glass rounded-2xl p-4 grid gap-1.5 content-start">
          <h3 className="text-[11px] font-bold tracking-widest text-white/50">SUELO · ÚLTIMA FICHA</h3>
          {ficha ? (
            <>
              <p className="text-2xl font-bold text-white">pH {ficha.phAgua ?? '?'}</p>
              <p className="text-xs text-white/60">MO {ficha.materiaOrganicaPct ?? '?'} % · VESS {ficha.estructuraVess !== undefined ? `Sq${ficha.estructuraVess}` : '—'} · {ficha.fecha}</p>
              <button onClick={() => navegar('/diagnostico')} className="text-xs font-semibold text-emerald-300 underline underline-offset-4 text-left">Ver diagnóstico →</button>
            </>
          ) : (
            <>
              <p className="text-sm text-white/60">Sin ficha registrada.</p>
              <button onClick={() => navegar('/ficha')} className="text-xs font-semibold text-emerald-300 underline underline-offset-4 text-left">Registrar ficha →</button>
            </>
          )}
        </article>

        <article className="glass rounded-2xl p-4 grid gap-1.5 content-start" aria-label="Lotes">
          <h3 className="text-[11px] font-bold tracking-widest text-white/50">LOTES · {lotes.length}</h3>
          <p className="numeros text-2xl font-bold text-white">{areaLotes.toFixed(1)} <span className="text-sm font-medium text-white/60">ha</span></p>
          <p className="text-xs text-white/60">{lotes.slice(0, 3).map((l) => l.nombre).join(' · ') || 'Dibuja el primero en el mapa'}</p>
          <button onClick={() => navegar('/lote')} className="text-xs font-semibold text-emerald-300 underline underline-offset-4 text-left">Ir a lotes →</button>
        </article>

        <article className="glass rounded-2xl p-4 grid gap-1.5 content-start" aria-label="Plan">
          <h3 className="text-[11px] font-bold tracking-widest text-white/50">PLAN · SAF</h3>
          <p className="text-2xl font-bold text-white">{conteoPlan.escenarios + conteoPlan.disenos} <span className="text-sm font-medium text-white/60">versiones</span></p>
          <p className="text-xs text-white/60">{conteoPlan.escenarios} escenarios · {conteoPlan.disenos} diseños</p>
          <button onClick={() => navegar('/simulador')} className="text-xs font-semibold text-emerald-300 underline underline-offset-4 text-left">Abrir simulador →</button>
        </article>

        <article className="glass rounded-2xl p-4 grid gap-1.5 content-start" aria-label="Madurez">
          <h3 className="text-[11px] font-bold tracking-widest text-white/50">MADUREZ</h3>
          {madurez ? (
            <p className="text-2xl font-bold text-white">{madurez.nivel} <span className="text-sm font-medium text-white/60">{madurez.puntos} pts</span></p>
          ) : (
            <p className="text-sm text-white/60">Calculando…</p>
          )}
          <p className="text-xs text-white/60">{madurez?.insignias.filter((i) => i.obtenida).map((i) => `★ ${i.titulo}`).join(' · ') || 'Completa fichas para ganar insignias'}</p>
        </article>
      </section>

      {/* Mini-GIS + salud del suelo (ref_1) */}
      <section className="grid gap-3 lg:grid-cols-5" aria-label="Mapa y salud del suelo">
        <article className="glass rounded-2xl p-4 grid gap-2 content-start lg:col-span-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[11px] font-bold tracking-widest text-white/50">MAPA · LOTES DEL PREDIO</h3>
            <button onClick={() => navegar('/sig')} className="text-[11px] font-semibold text-emerald-300 underline underline-offset-4">Abrir SIG →</button>
          </div>
          <MiniMapa lotes={lotes} />
        </article>
        <article className="glass rounded-2xl p-4 grid gap-2 content-start lg:col-span-2 border-l-2 border-l-tierra-media" aria-label="Puntaje de salud del suelo">
          <h3 className="text-[11px] font-bold tracking-widest text-white/50">SOIL HEALTH SCORE</h3>
          {hallazgos.length === 0 ? (
            <>
              <p className="text-sm text-white/60">Sin parámetros con rango validado.</p>
              <button onClick={() => navegar('/ficha')} className="text-xs font-semibold text-emerald-300 underline underline-offset-4 text-left">Registrar ficha →</button>
            </>
          ) : (
            <>
              <p className="numeros text-4xl font-bold text-calendula">{score}<span className="text-base font-medium text-white/50">/100</span></p>
              <p className="text-xs font-semibold capitalize text-amber-200">{etiquetaScore} · {hallazgos.length} parámetros</p>
              <ul className="grid gap-1">
                {hallazgos.slice(0, 4).map((h) => (
                  <li key={h.parametro} className="flex items-center justify-between gap-2 text-xs border-b border-white/10 py-1">
                    <span className="text-white/70">{h.parametro}</span>
                    <span className={`font-semibold ${h.estado === 'optimo' ? 'text-emerald-300' : h.estado === 'deficiente' ? 'text-red-400' : 'text-amber-300'}`}>
                      {h.valor} {h.unidad}
                    </span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navegar('/diagnostico')} className="text-xs font-semibold text-emerald-300 underline underline-offset-4 text-left">Ver diagnóstico →</button>
            </>
          )}
        </article>
      </section>

      {/* Accesos rápidos con foto */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Accesos directos">
        {ACCESOS.map((a) => (
          <button
            key={a.titulo}
            onClick={() => navegar(a.ruta)}
            className="group text-left relative overflow-hidden rounded-sm text-white min-h-[120px] grid content-end gap-0.5 p-4 border border-white/10 hover:border-emerald-400/50 transition-all"
          >
            <img src={a.imagen} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-[1.06]" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" aria-hidden />
            <span className="relative text-sm font-semibold leading-snug">{a.titulo}</span>
            <span className="relative text-[11px] text-white/70">{a.subtitulo}</span>
          </button>
        ))}
      </section>

      {/* Recomendaciones SAF del simulador (ref_1) */}
      {escenarios.length > 0 && (
        <section className="glass rounded-2xl p-4 grid gap-3" aria-label="Recomendaciones de SAF">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[11px] font-bold tracking-widest text-white/50">RECOMENDACIONES DE SAF</h3>
            <button onClick={() => navegar('/simulador')} className="text-[11px] font-semibold text-emerald-300 underline underline-offset-4">Abrir simulador →</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {escenarios.map((e) => (
              <article key={e.id} className="rounded-sm border border-white/10 bg-white/5 p-3 grid gap-1.5 content-start">
                <p className="text-sm font-semibold text-white">{e.nombre}</p>
                <div className="h-2 w-full flex overflow-hidden rounded-full bg-white/10" aria-hidden>
                  {e.usosSuelo.map((u) => (
                    u.porcentaje > 0 ? (
                      <span
                        key={u.uso}
                        style={{ width: `${u.porcentaje}%`, background: u.uso.toLowerCase().includes('conserv') || u.uso.toLowerCase().includes('corredor') ? '#b08968' : '#10b981' }}
                        title={`${u.uso} ${u.porcentaje} %`}
                      />
                    ) : null
                  ))}
                </div>
                <p className="text-[11px] text-white/60">
                  RUSLE {e.rusleAntes ?? '?'} → {e.rusleDespues ?? '?'} t/ha/año · Cobertura año 5: {e.coberturaAno5 ?? '?'} %
                </p>
                <p className="text-[11px] text-white/60">{e.componentes.slice(0, 3).map((c) => c.especie).join(' · ')}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Modo campo: medidor + caché y sincronización */}
      <section className="glass rounded-2xl p-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center" aria-label="Estado de sincronización">
        {madurez && <MedidorRadial madurez={madurez} />}
        <div className="grid gap-4 content-start">
          <div className="grid gap-1">
            <h4 className="text-base font-medium tracking-wide text-white">Modo campo · trabaja sin conexión</h4>
            <p className="text-xs text-white/60">
              {fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'} • Máx 200 MB por predio
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navegar('/ficha')} className="boton-campo bg-emerald-600 text-white text-sm font-semibold px-6 py-2.5 rounded-sm hover:bg-emerald-700 transition-colors">
              Registrar ficha
            </button>
            <button onClick={() => navegar('/sig')} className="boton-campo bg-transparent text-white text-sm font-semibold px-6 py-2.5 rounded-sm border border-white/40 hover:bg-white/10 transition-colors">
              Abrir mapa SIG
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
