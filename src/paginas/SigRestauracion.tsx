import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { Boton, BotonSecundario } from '../componentes/ui/Boton';
import { MapaSig } from '../componentes/sig/MapaSig';
import { PanelCapasSig } from '../componentes/sig/PanelCapasSig';
import { TarjetaPendienteDem } from '../componentes/sig/TarjetaPendienteDem';
import { TarjetaRusle } from '../componentes/sig/TarjetaRusle';
import { TarjetaSerieNdvi } from '../componentes/sig/TarjetaSerieNdvi';
import { TarjetaFrontera } from '../componentes/sig/TarjetaFrontera';
import { FECHAS_NDVI } from '../datos/sig';
import { baseDatos, etiquetaCache, type LoteLocal } from '../base_datos/local';
import { BBOX_PREDETERMINADO, estimarPendienteDem, estimarRusle, extraerGeometria, obtenerGeojsonIgac, obtenerSerieNdvi, solicitarPrecarga, type EstimacionDem, type InterpretacionNdvi, type PuntoNdvi, type ResultadoRusle } from '../servicios/sig';
import { usoFlujo } from '../estado/usoFlujo';
import { usoPredio } from '../estado/usoPredio';

type Pestana = 'igac' | 'pendiente' | 'ndvi' | 'upra';

const PESTANAS: { id: Pestana; titulo: string; insignia: string }[] = [
  { id: 'igac', titulo: 'Capas IGAC', insignia: 'MIXTO' },
  { id: 'pendiente', titulo: 'Pendiente / RUSLE', insignia: 'MIXTO' },
  { id: 'ndvi', titulo: 'NDVI satelital', insignia: 'ONLINE' },
  { id: 'upra', titulo: 'UPRA', insignia: 'MIXTO' },
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
      <section className="bg-selva text-white p-4 sm:p-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center rounded-sm" aria-label="Estado offline">
        <div className="grid gap-1">
          <p className="text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7FC4BB] animate-pulse" aria-hidden />
            Trabajando en {id} · modo campo offline
          </p>
          <p className="text-xs text-white/60">
            {fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'} · Máx 200 MB por predio · Fuentes: IGAC · Copernicus
          </p>
        </div>
        <Boton onClick={() => void precargar()} disabled={cargando} className="!bg-[#059669] hover:!bg-[#047857]">
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
              pestana === p.id ? 'bg-[#059669] text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-[#059669]'
            }`}
          >
            {p.titulo}
            <span className={`text-[9px] font-bold tracking-widest rounded-sm px-1.5 py-0.5 ${pestana === p.id ? 'bg-white/20 text-white' : 'bg-selva text-amber-300'}`}>
              {p.insignia}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr] items-start">
        {/* Panel lateral: capas + controles */}
        <div className="grid gap-4 content-start">
          {pestana === 'upra' ? (
            <TarjetaFrontera predioId={id} />
          ) : (
            <Tarjeta titulo={pestana === 'igac' ? 'Capas oficiales' : pestana === 'pendiente' ? 'Relieve y erosión' : 'Vegetación'}>
              <PanelCapasSig activas={capas} alCambiar={alternar} guardadas={guardadas} />
            </Tarjeta>
          )}

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
                className="w-full accent-[#059669] min-h-[44px]"
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
              {pestana === 'upra' && 'Frontera municipal oficial; la aptitud por cultivo se confirma en SIPRA.'}
            </p>
          </Tarjeta>

          {pestana === 'pendiente' && (
            <>
              <TarjetaPendienteDem
                predioId={id}
                lotes={lotes}
                loteSel={loteSel}
                alElegirLote={setLoteSel}
                estimacion={estimacion}
                calculando={calculando}
                alCalcular={() => void calcularPendiente()}
                alGuardar={() => void guardarPendiente()}
              />
              <TarjetaRusle
                predioId={id}
                lotes={lotes}
                loteSel={loteSel}
                pendienteDem={estimacion?.pendiente_pct}
                coberturaPct={coberturaPct} alCobertura={setCoberturaPct}
                longitudM={longitudM} alLongitud={setLongitudM}
                rVal={rVal} alR={setRVal}
                kVal={kVal} alK={setKVal}
                practica={practica} alPractica={setPractica}
                rusle={rusle}
                calculando={calculandoRusle}
                alCalcular={() => void calcularRusle()}
                alGuardar={() => void guardarErosion()}
              />
            </>
          )}

          {pestana === 'ndvi' && (
            <TarjetaSerieNdvi
              serie={serie}
              interp={interp}
              cargando={cargandoSerie}
              alActualizar={() => void cargarSerie()}
            />
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
              <Link to="/ficha" className="boton-campo inline-flex items-center px-5 py-2.5 font-semibold text-sm text-emerald-700 underline underline-offset-4">
                Registrar ficha VSA →
              </Link>
              <Link to="/diagnostico" className="boton-campo inline-flex items-center px-5 py-2.5 font-semibold text-sm text-emerald-700 underline underline-offset-4">
                Ver diagnóstico →
              </Link>
            </div>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
