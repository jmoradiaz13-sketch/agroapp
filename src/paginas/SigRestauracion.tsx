import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { Boton, BotonSecundario } from '../componentes/ui/Boton';
import { MapaSig } from '../componentes/MapaSig';
import { PanelCapasSig } from '../componentes/PanelCapasSig';
import { FECHAS_NDVI } from '../datos/sig';
import { baseDatos, etiquetaCache, type LoteLocal } from '../base_datos/local';
import { BBOX_PREDETERMINADO, estimarPendienteDem, estimarRusle, obtenerGeojsonIgac, obtenerSerieNdvi, solicitarPrecarga, type EstimacionDem, type InterpretacionNdvi, type PuntoNdvi, type ResultadoRusle } from '../servicios/sig';
import { usoFlujo } from '../estado/usoFlujo';
import { usoPredio } from '../estado/usoPredio';

type Pestana = 'igac' | 'pendiente' | 'ndvi';

const PESTANAS: { id: Pestana; titulo: string; insignia: string }[] = [
  { id: 'igac', titulo: 'Capas IGAC', insignia: 'MIXTO' },
  { id: 'pendiente', titulo: 'Pendiente / RUSLE', insignia: 'MIXTO' },
  { id: 'ndvi', titulo: 'NDVI satelital', insignia: 'ONLINE' },
];

// Sección SIG para restauración ecológica (estilo OneSoil/QField):
// una sola ventana con 3 vistas, mapa + panel sincronizados en PC y móvil.
// Precarga en oficina → trabajo offline en campo (caché 200 MB/predio).
export function SigRestauracion() {
  const { predioIdentificador } = usoFlujo();
  const { fechaCache } = usoPredio();
  const id = predioIdentificador ?? 'finca-mirador';
  const [pestana, setPestana] = useState<Pestana>('igac');
  const [capas, setCapas] = useState<string[]>(['igac-agrologia', 'pendiente', 'ndvi']);
  const [opacidad, setOpacidad] = useState(0.45);
  const [fechaNdvi, setFechaNdvi] = useState(FECHAS_NDVI[0].id);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardadas, setGuardadas] = useState<Record<string, string>>({});
  const [geoGuardado, setGeoGuardado] = useState<GeoJSON.Geometry[]>([]);
  const [lotes, setLotes] = useState<LoteLocal[]>([]);
  const [loteSel, setLoteSel] = useState<number | undefined>(undefined);
  const [estimacion, setEstimacion] = useState<EstimacionDem | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [serie, setSerie] = useState<PuntoNdvi[] | null>(null);
  const [interp, setInterp] = useState<InterpretacionNdvi | null>(null);
  const [cargandoSerie, setCargandoSerie] = useState(false);
  const [coberturaPct, setCoberturaPct] = useState(60);
  const [longitudM, setLongitudM] = useState(50);
  const [rVal, setRVal] = useState(3000);
  const [kVal, setKVal] = useState(0.03);
  const [practica, setPractica] = useState('sin_practicas');
  const [rusle, setRusle] = useState<ResultadoRusle | null>(null);
  const [calculandoRusle, setCalculandoRusle] = useState(false);

  // Capas IGAC del panel -> nombreCapa en Dexie capasIgac.
  const MAPA_DEXIE: [string, string][] = [
    ['igac-agrologia', 'agrologia'],
    ['igac-predial', 'predial'],
  ];

  const cargarGuardadas = async () => {
    const filas = await baseDatos.capasIgac.where('predioIdentificador').equals(id).toArray();
    const fechas: Record<string, string> = {};
    const geoms: GeoJSON.Geometry[] = [];
    for (const f of filas) {
      const idCapa = MAPA_DEXIE.find(([, dexie]) => dexie === f.nombreCapa)?.[0];
      if (idCapa) fechas[idCapa] = f.fechaActualizacion.slice(0, 10);
      if (f.geojson) geoms.push(f.geojson);
    }
    setGuardadas(fechas);
    setGeoGuardado(geoms);
  };

  useEffect(() => {
    void cargarGuardadas();
    void baseDatos.lotes.where('predioIdentificador').equals(id).toArray().then((lista) => {
      setLotes(lista);
      setLoteSel((actual) => actual ?? lista[0]?.id);
    });
    try {
      const cache = localStorage.getItem(`agroapp_ndvi_${id}`);
      if (cache) {
        const guardada = JSON.parse(cache) as { puntos: PuntoNdvi[]; interpretacion: InterpretacionNdvi };
        setSerie(guardada.puntos);
        setInterp(guardada.interpretacion);
      }
    } catch {
      // caché ilegible: se ignora y se pide la serie
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const alternar = (capa: string) =>
    setCapas((v) => (v.includes(capa) ? v.filter((c) => c !== capa) : [...v, capa]));

  function extraerGeometria(geojson: unknown): GeoJSON.Geometry | null {
    if (!geojson || typeof geojson !== 'object') return null;
    const g = geojson as { type?: string; geometry?: GeoJSON.Geometry; features?: { geometry?: GeoJSON.Geometry }[] };
    if (g.type === 'FeatureCollection' && g.features?.[0]?.geometry) return g.features[0].geometry;
    if (g.type === 'Feature' && g.geometry) return g.geometry;
    if (g.type && 'coordinates' in g) return g as unknown as GeoJSON.Geometry;
    return null;
  }

  const precargar = async () => {
    setCargando(true);
    setMensaje('Solicitando plan de precarga al servidor…');
    const resultado = await solicitarPrecarga(id, BBOX_PREDETERMINADO, ['agrologia', 'predial']);
    if (!resultado.ok || !resultado.plan) {
      setMensaje(resultado.error ?? 'Sin conexión: anota las capas y precarga con wifi en oficina.');
      setCargando(false);
      return;
    }
    let guardadasOk = 0;
    const hoy = new Date().toISOString().slice(0, 10);
    for (const [, nombreDexie] of MAPA_DEXIE) {
      const modo = navigator.onLine ? 'real' : 'demo';
      let resp = await obtenerGeojsonIgac(nombreDexie, BBOX_PREDETERMINADO, modo);
      if (!resp.ok && modo === 'real') resp = await obtenerGeojsonIgac(nombreDexie, BBOX_PREDETERMINADO, 'demo');
      const geom = resp.ok ? extraerGeometria(resp.geojson) : null;
      if (geom) {
        await baseDatos.capasIgac.where({ predioIdentificador: id, nombreCapa: nombreDexie }).delete();
        await baseDatos.capasIgac.add({ predioIdentificador: id, nombreCapa: nombreDexie, geojson: geom, fechaActualizacion: new Date().toISOString() });
        guardadasOk += 1;
      }
    }
    await cargarGuardadas();
    setMensaje(
      guardadasOk > 0
        ? `Precarga lista para ${id}: ${resultado.plan.peso_total_mb} MB (límite 200) · ${guardadasOk} capas guardadas el ${hoy} para campo offline.`
        : 'Plan recibido pero sin geometrías: reintenta con wifi en oficina.',
    );
    setCargando(false);
  };

  const calcularPendiente = async () => {
    setCalculando(true);
    const modo = navigator.onLine ? 'real' : 'demo';
    let resp = await estimarPendienteDem(id, BBOX_PREDETERMINADO, modo);
    if (!resp.ok && modo === 'real') resp = await estimarPendienteDem(id, BBOX_PREDETERMINADO, 'demo');
    if (resp.ok && resp.estimacion) {
      setEstimacion(resp.estimacion);
      setMensaje(`DEM: pendiente media ${resp.estimacion.pendiente_pct} % (${resp.estimacion.clase}). ${resp.estimacion.manejo}`);
    } else {
      setMensaje(resp.error ?? 'Sin DEM: usa la guía local < 7 / 7–25 / > 25 %.');
    }
    setCalculando(false);
  };

  const guardarPendiente = async () => {
    if (loteSel === undefined || !estimacion) return;
    await baseDatos.lotes.update(loteSel, {
      pendientePct: estimacion.pendiente_pct,
      fechaActualizacion: new Date().toISOString(),
    });
    const lista = await baseDatos.lotes.where('predioIdentificador').equals(id).toArray();
    setLotes(lista);
    const nombre = lista.find((l) => l.id === loteSel)?.nombre ?? 'lote';
    setMensaje(`Pendiente ${estimacion.pendiente_pct} % guardada en ${nombre}. Viaja offline a campo.`);
  };

  const calcularRusle = async () => {
    const lote = lotes.find((l) => l.id === loteSel);
    const pendiente = estimacion?.pendiente_pct ?? lote?.pendientePct;
    if (pendiente === undefined || pendiente === null) {
      setMensaje('Calcula primero la pendiente DEM o registra la pendiente del lote.');
      return;
    }
    setCalculandoRusle(true);
    const resp = await estimarRusle({
      predio: id, pendientePct: pendiente, coberturaPct, longitudM, r: rVal, k: kVal, practica,
    });
    if (resp.ok && resp.resultado) {
      setRusle(resp.resultado);
      setMensaje(`RUSLE: ${resp.resultado.perdida_t_ha_ano} t/ha/año (${resp.resultado.clase}). ${resp.resultado.manejo}`);
    } else {
      setMensaje(resp.error ?? 'Sin cálculo: reintenta en oficina.');
    }
    setCalculandoRusle(false);
  };

  const guardarErosion = async () => {
    if (loteSel === undefined || !rusle) return;
    await baseDatos.lotes.update(loteSel, {
      erosion: `${rusle.clase} (RUSLE ${rusle.perdida_t_ha_ano} t/ha/año)`,
      fechaActualizacion: new Date().toISOString(),
    });
    const lista = await baseDatos.lotes.where('predioIdentificador').equals(id).toArray();
    setLotes(lista);
    setMensaje(`Erosión ${rusle.clase} guardada en el lote. Llévala a la ficha y al diagnóstico.`);
  };

  const cargarSerie = async () => {    setCargandoSerie(true);
    const resp = await obtenerSerieNdvi(id, BBOX_PREDETERMINADO, 'demo');
    if (resp.ok && resp.puntos && resp.interpretacion) {
      setSerie(resp.puntos);
      setInterp(resp.interpretacion);
      try {
        localStorage.setItem(`agroapp_ndvi_${id}`, JSON.stringify({ puntos: resp.puntos, interpretacion: resp.interpretacion }));
      } catch {
        // almacenamiento lleno: la serie en memoria basta
      }
      setMensaje(
        resp.interpretacion.alerta
          ?? `Serie NDVI ${resp.interpretacion.tendencia} (Δ ${resp.interpretacion.delta}). Sin zonas críticas.`,
      );
    } else {
      setMensaje(resp.error ?? 'Sin serie: reintenta en oficina.');
    }
    setCargandoSerie(false);
  };

  const crearPunto = async () => {
    const codigo = `MU-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 90) + 10)}`;
    await baseDatos.puntosMuestreo.add({
      predioIdentificador: id,
      codigo,
      lat: 4.645,
      lng: -74.045,
      fecha: new Date().toISOString().slice(0, 10),
      sincronizada: false,
    });
    setMensaje(`Punto ${codigo} creado en zona débil. Ábrelo en Lotes y registra su ficha VSA con foto.`);
  };

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="SIG · Restauración ecológica"
        titulo="Mapas para recuperar suelos y coberturas"
        descripcion="Capas oficiales IGAC, pendiente y NDVI sobre el mismo mapa. Precarga en oficina y verifica en campo sin conexión."
        imagen="/imagenes/5.jpg"
      />

      {/* Estado offline + precarga (patrón Scout Mode / QField) */}
      <section className="bg-[#141414] text-white p-4 sm:p-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center rounded-sm" aria-label="Estado offline">
        <div className="grid gap-1">
          <p className="text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#86efac] animate-pulse" aria-hidden />
            Trabajando en {id} · modo campo offline
          </p>
          <p className="text-xs text-white/60">
            {fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'} · Máx 200 MB por predio · Fuentes: IGAC · Copernicus
          </p>
        </div>
        <Boton onClick={() => void precargar()} disabled={cargando} className="!bg-[#1b5e20] hover:!bg-[#124116]">
          {cargando ? 'Precargando…' : '📦 Precargar para campo'}
        </Boton>
      </section>
      {mensaje && <p className="mensaje-ok" role="status">{mensaje}</p>}

      {/* Pestañas sincronizadas PC/móvil */}
      <div className="scroll-sutil flex flex-nowrap gap-1.5 overflow-x-auto p-3 border border-neutral-200 bg-green-50/50 rounded-sm" role="tablist" aria-label="Herramientas SIG">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`boton-campo shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-sm transition-colors flex items-center gap-2 ${
              pestana === p.id ? 'bg-[#1b5e20] text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-[#1b5e20]'
            }`}
          >
            {p.titulo}
            <span className={`text-[9px] font-bold tracking-widest rounded-sm px-1.5 py-0.5 ${pestana === p.id ? 'bg-white/20 text-white' : 'bg-[#141414] text-amber-300'}`}>
              {p.insignia}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr] items-start">
        {/* Panel lateral: capas + controles */}
        <div className="grid gap-4 content-start">
          <Tarjeta titulo={pestana === 'igac' ? 'Capas oficiales' : pestana === 'pendiente' ? 'Relieve y erosión' : 'Vegetación'}>
            <PanelCapasSig activas={capas} alCambiar={alternar} guardadas={guardadas} />
          </Tarjeta>

          <Tarjeta titulo="Visualización">
            <label className="etiqueta-campo">
              Opacidad de la capa ({Math.round(opacidad * 100)} %)
              <input
                type="range"
                min={0.15}
                max={0.85}
                step={0.05}
                value={opacidad}
                onChange={(e) => setOpacidad(Number(e.target.value))}
                className="w-full accent-[#1b5e20] min-h-[44px]"
                aria-label="Opacidad de la capa activa"
              />
            </label>
            {pestana === 'ndvi' && (
              <label className="etiqueta-campo">
                Fecha Sentinel-2
                <select value={fechaNdvi} onChange={(e) => setFechaNdvi(e.target.value)} className="campo-entrada">
                  {FECHAS_NDVI.map((f) => (
                    <option key={f.id} value={f.id}>{f.etiqueta}</option>
                  ))}
                </select>
              </label>
            )}
            <p className="text-[11px] text-neutral-500">
              {pestana === 'igac' && 'En oficina se ve el WMS oficial; en campo se usa la copia GeoJSON precargada.'}
              {pestana === 'pendiente' && 'Verde < 7 % · ámbar 7–25 % · rojo > 25 %. Toca cada zona para su manejo.'}
              {pestana === 'ndvi' && 'Rojo < 0,3 suelo/estrés · verde > 0,6 vigor. La nubosidad andina obliga a usar el último despejado.'}
            </p>
          </Tarjeta>

          {pestana === 'pendiente' && (
            <>
            <Tarjeta titulo="Pendiente DEM del lote">
              {lotes.length === 0 ? (
                <p className="mensaje-info">Sin lotes en {id}. Dibuja el primero en Lotes o siembra la demo en Predios.</p>
              ) : (
                <>
                  <label className="etiqueta-campo">
                    Lote
                    <select
                      value={loteSel ?? ''}
                      onChange={(e) => setLoteSel(Number(e.target.value))}
                      className="campo-entrada"
                    >
                      {lotes.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nombre} · pendiente actual: {l.pendientePct ?? '?'} %
                        </option>
                      ))}
                    </select>
                  </label>
                  <Boton onClick={() => void calcularPendiente()} disabled={calculando}>
                    {calculando ? 'Muestreando DEM…' : '⛰ Calcular pendiente DEM'}
                  </Boton>
                  {estimacion && (
                    <div className="grid gap-1 border border-neutral-200 p-3">
                      <p className="text-sm">
                        Media <strong className="font-semibold">{estimacion.pendiente_pct} %</strong>
                        {' '}· máx {estimacion.pendiente_max_pct} % · desnivel {estimacion.desnivel_m} m
                      </p>
                      <p className="text-sm font-semibold text-[#1b5e20] capitalize">{estimacion.clase}</p>
                      <p className="text-xs text-neutral-600">{estimacion.manejo}</p>
                      <p className="text-[11px] text-neutral-500">Fuente: {estimacion.fuente}</p>
                      <div>
                        <Boton onClick={() => void guardarPendiente()}>Guardar en el lote</Boton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Tarjeta>

            <Tarjeta titulo="Riesgo erosión (RUSLE)">
              {lotes.length === 0 ? (
                <p className="mensaje-info">Sin lotes en {id}. El cálculo usa la pendiente del lote seleccionado.</p>
              ) : (
                <>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    A = R·K·LS·C·P. LS viene de la pendiente DEM
                    ({estimacion?.pendiente_pct ?? lotes.find((l) => l.id === loteSel)?.pendientePct ?? '?'} %);
                    C de tu cobertura, R/K/P con valores andinos editables.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="etiqueta-campo">Cobertura vegetal (%)
                      <input className="campo-entrada" type="number" min={0} max={100} value={coberturaPct} onChange={(e) => setCoberturaPct(Number(e.target.value))} />
                    </label>
                    <label className="etiqueta-campo">Longitud ladera (m)
                      <input className="campo-entrada" type="number" min={1} max={1000} value={longitudM} onChange={(e) => setLongitudM(Number(e.target.value))} />
                    </label>
                    <label className="etiqueta-campo">R lluvia (Andina ~3000)
                      <input className="campo-entrada" type="number" min={1} value={rVal} onChange={(e) => setRVal(Number(e.target.value))} />
                    </label>
                    <label className="etiqueta-campo">K suelo (franco ~0.03)
                      <input className="campo-entrada" type="number" min={0.001} step={0.005} value={kVal} onChange={(e) => setKVal(Number(e.target.value))} />
                    </label>
                  </div>
                  <label className="etiqueta-campo">Práctica de conservación
                    <select value={practica} onChange={(e) => setPractica(e.target.value)} className="campo-entrada">
                      <option value="sin_practicas">Sin prácticas (P = 1)</option>
                      <option value="curvas_nivel">Curvas a nivel (P = 0.6)</option>
                      <option value="terrazas">Terrazas (P = 0.4)</option>
                      <option value="cobertura_permanente">Cobertura permanente (P = 0.3)</option>
                    </select>
                  </label>
                  <Boton onClick={() => void calcularRusle()} disabled={calculandoRusle}>
                    {calculandoRusle ? 'Calculando…' : '🧮 Calcular RUSLE'}
                  </Boton>
                  {rusle && (
                    <div className="grid gap-1 border border-neutral-200 p-3">
                      <p className="text-sm">
                        Pérdida <strong className="font-semibold">{rusle.perdida_t_ha_ano} t/ha/año</strong>
                        {' '}· <span className="font-semibold capitalize">{rusle.clase}</span>
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        R {rusle.factores.r} · K {rusle.factores.k} · LS {rusle.factores.ls} · C {rusle.factores.c} · P {rusle.factores.p}
                      </p>
                      <p className="text-xs text-neutral-600">{rusle.manejo}</p>
                      <div>
                        <Boton onClick={() => void guardarErosion()}>Guardar erosión en el lote</Boton>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Tarjeta>
            </>
          )}

          {pestana === 'ndvi' && (
            <Tarjeta titulo="Serie temporal NDVI">
              <Boton onClick={() => void cargarSerie()} disabled={cargandoSerie}>
                {cargandoSerie ? 'Leyendo serie…' : '🛰 Actualizar serie'}
              </Boton>
              {!serie ? (
                <p className="mensaje-info">Sin serie en este dispositivo. Actualiza con red o usa la precarga de oficina.</p>
              ) : (
                <>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer>
                      <LineChart data={serie.map((p) => ({ ...p, dia: p.fecha.slice(5) }))}>
                        <XAxis dataKey="dia" fontSize={11} />
                        <YAxis domain={[0, 1]} fontSize={11} />
                        <Tooltip />
                        <ReferenceLine y={0.3} stroke="#dc2626" strokeDasharray="4 3" />
                        <ReferenceLine y={0.6} stroke="#f59e0b" strokeDasharray="4 3" />
                        <Line type="monotone" dataKey="ndvi" stroke="#1b5e20" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <dl className="grid gap-1 text-sm">
                    {serie.map((p) => (
                      <div key={p.fecha} className="flex items-center justify-between gap-2 border-b border-neutral-100 py-1">
                        <dt className="text-neutral-500">{p.fecha}</dt>
                        <dd className="font-semibold">{p.ndvi} · <span className="font-medium capitalize">{p.clase}</span></dd>
                      </div>
                    ))}
                  </dl>
                  {interp && (
                    <p className={interp.alerta ? 'mensaje-error' : 'mensaje-ok'}>
                      Tendencia {interp.tendencia} (Δ {interp.delta}). {interp.alerta ?? 'Sin zonas críticas.'}
                    </p>
                  )}
                </>
              )}
            </Tarjeta>
          )}
        </div>

        {/* Mapa + acción */}
        <div className="grid gap-4 content-start">
          <Tarjeta titulo={`Mapa — ${id}`}>
            <MapaSig capasActivas={capas} opacidad={opacidad} modoNdvi={pestana === 'ndvi' ? 'ndvi' : 'pendiente'} geoGuardado={geoGuardado} />
          </Tarjeta>

          <Tarjeta titulo="Del mapa a la acción">
            <p className="text-sm text-neutral-600 leading-relaxed">
              {pestana === 'igac' && 'Compara el límite IGAC con tu lote dibujado. Si hay desfase catastral, ajusta el lote y deja nota para oficina.'}
              {pestana === 'pendiente' && 'Las zonas rojas piden cobertura permanente; las ámbar, curvas a nivel. Lleva esta lectura a la ficha física (VESS + densidad).'}
              {pestana === 'ndvi' && 'Cada mancha roja es una visita: crea su punto de muestreo y registra VSA + foto cenital.'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {pestana === 'ndvi' && <Boton onClick={() => void crearPunto()}>＋ Crear punto en zona débil</Boton>}
              <Link to="/lote"><BotonSecundario>Ir a lotes →</BotonSecundario></Link>
              <Link to="/ficha" className="boton-campo inline-flex items-center px-5 py-2.5 font-semibold text-sm text-[#1b5e20] underline underline-offset-4">
                Registrar ficha VSA →
              </Link>
              <Link to="/diagnostico" className="boton-campo inline-flex items-center px-5 py-2.5 font-semibold text-sm text-[#1b5e20] underline underline-offset-4">
                Ver diagnóstico →
              </Link>
            </div>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
