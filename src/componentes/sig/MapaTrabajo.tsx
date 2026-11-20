import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Map as MapaLeaflet } from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  baseDatos,
  tamanoCachePredio,
  LIMITE_CACHE_PREDIO_BYTES,
  type LoteLocal,
  type PredioLocal,
} from '../../base_datos/local';
import { BASES_MAPA } from '../../datos/sig';
import { usoMapaSIG, type TipoPunto } from '../../estado/usoMapaSIG';
import { usarGps } from '../../servicios/gps';
import {
  areaHaPoligono,
  bboxDeGeometrias,
  formatearArea,
  motivoPoligonoInvalido,
  perimetroMPoligono,
  poligonoContenido,
  poligonoDesdePuntos,
  poligonosSeSolapan,
} from '../../servicios/geo';
import { CapturarMapa, RastreadorMapa, ToquesMapa, ajustarVista } from './AyudantesMapa';
import { BarraEstadoMapa } from './BarraEstadoMapa';
import { CapasProyecto } from './CapasProyecto';
import { CapasWmsIgac } from './CapaWmsIgac';
import { ControlesMapa } from './ControlesMapa';
import { EditorBorrador } from './EditorBorrador';
import { EditorPunto } from './EditorPunto';
import { useDatosMapa } from './useDatosMapa';

const CENTRO_INICIAL: [number, number] = [4.645, -74.045];

const PREFIJO_PUNTO: Record<TipoPunto, string> = {
  muestra: 'MU',
  arbol: 'AR',
  agua: 'AG',
  infraestructura: 'IN',
};

export function MapaTrabajo({
  identificador,
  predio: predioProp,
  altura = 'clamp(420px, 68vh, 760px)',
  alCambiarLotes,
  alCambiarPredio,
}: {
  identificador: string;
  predio?: PredioLocal | null;
  altura?: string;
  alCambiarLotes?: (lotes: LoteLocal[]) => void;
  alCambiarPredio?: (predio: PredioLocal) => void;
}) {
  const {
    base,
    capasActivas,
    opacidad,
    modo,
    borrador,
    loteSeleccionadoId,
    mensaje,
    puntoBorrador,
    alternarCapa,
    seleccionarLote,
    agregarPunto,
    moverPunto,
    finalizarDibujo,
    colocarPunto,
    moverPuntoBorrador,
    finalizarPunto,
    fijarMensaje,
  } = usoMapaSIG();
  const { precision, ubicar, mensaje: mensajeGps } = usarGps();
  const [mapa, setMapa] = useState<MapaLeaflet | null>(null);
  const [coordenada, setCoordenada] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: CENTRO_INICIAL[0],
    lng: CENTRO_INICIAL[1],
    zoom: 14,
  });
  const [senalAjuste, setSenalAjuste] = useState(0);
  const {
    predioLocal,
    setPredioLocal,
    lotes,
    puntos,
    capasOffline,
    enLinea,
    cargarLotes,
    cargarPuntos,
  } = useDatosMapa(identificador, predioProp, alCambiarLotes);

  const bbox = useMemo(
    () =>
      bboxDeGeometrias(
        [predioLocal?.geometria, ...lotes.map((l) => l.geometria)],
        borrador?.puntos ?? [],
      ),
    [predioLocal, lotes, borrador?.puntos],
  );

  useEffect(() => {
    if (!mapa) return;
    ajustarVista(mapa, bbox);
    // Solo recentrar cuando cambian las geometrías o se pulse Recentrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, senalAjuste, predioLocal?.identificador, lotes.length]);

  const cambiarCoordenada = useCallback((lat: number, lng: number, zoom: number) => {
    setCoordenada({ lat, lng, zoom });
  }, []);

  const agregarConGps = () => {
    ubicar((lat, lng) => {
      if (modo === 'punto') {
        colocarPunto([lng, lat]);
      } else {
        agregarPunto([lng, lat]);
      }
      if (precision !== null && precision > 30) {
        fijarMensaje(`GPS ±${Math.round(precision)} m: confirma el punto en el mapa.`);
      }
    });
  };

  const guardarPunto = async () => {
    if (!puntoBorrador?.coordenada) {
      fijarMensaje('Ubica el punto tocando el mapa o con GPS.');
      return;
    }
    const [lng, lat] = puntoBorrador.coordenada;
    const fecha = new Date().toISOString().slice(0, 10);
    const baseCodigo = `${PREFIJO_PUNTO[puntoBorrador.tipo]}-${fecha.replace(/-/g, '')}-`;
    const existentes = await baseDatos.puntosMuestreo.where('codigo').startsWith(baseCodigo).count();
    const codigo = `${baseCodigo}${String(existentes + 1).padStart(2, '0')}`;
    const lote = lotes.find((l) => l.id === loteSeleccionadoId);
    await baseDatos.puntosMuestreo.add({
      predioIdentificador: identificador,
      loteNombre: lote?.nombre,
      codigo,
      lat,
      lng,
      fecha,
      sincronizada: false,
      tipo: puntoBorrador.tipo,
      etiqueta: puntoBorrador.etiqueta.trim() || undefined,
    });
    await cargarPuntos();
    finalizarPunto();
    fijarMensaje(`Punto ${codigo} guardado offline${lote ? ` en ${lote.nombre}` : ''}.`);
  };

  const guardar = async () => {
    if (!borrador) return;
    const problema = motivoPoligonoInvalido(borrador.puntos);
    if (problema) {
      fijarMensaje(problema);
      return;
    }
    const geometria = poligonoDesdePuntos(borrador.puntos);
    if (!geometria) return;
    const areaHa = Math.round(areaHaPoligono(geometria) * 100) / 100;
    const fechaActualizacion = new Date().toISOString();
    const tamano = await tamanoCachePredio(identificador);
    if (tamano > LIMITE_CACHE_PREDIO_BYTES) {
      fijarMensaje('Límite de 200 MB por predio superado. Libera fotos o capas antes de guardar.');
      return;
    }

    if (borrador.tipo === 'predio') {
      if (!predioLocal?.id) {
        fijarMensaje('No se encontró el predio en este dispositivo. Sincroniza antes de delimitar.');
        return;
      }
      const actualizado: PredioLocal = {
        ...predioLocal,
        geometria,
        areaTotalHa: areaHa,
        fechaActualizacion,
        estadoSincronizacion: 'pendiente',
      };
      await baseDatos.predios.put(actualizado);
      setPredioLocal(actualizado);
      alCambiarPredio?.(actualizado);
      finalizarDibujo();
      fijarMensaje(`Predio guardado offline: ${formatearArea(areaHa)}.`);
      setSenalAjuste((v) => v + 1);
      return;
    }

    if (predioLocal?.geometria && !poligonoContenido(geometria, predioLocal.geometria)) {
      fijarMensaje('El lote debe quedar dentro del predio. Revisa el lindero exterior.');
      return;
    }
    const otros = lotes.filter((l) => l.id !== borrador.loteId);
    if (otros.some((l) => poligonosSeSolapan(geometria, l.geometria))) {
      fijarMensaje('Este lote se cruza con otro lote guardado. Ajusta los vértices.');
      return;
    }

    const nombre = borrador.nombre.trim() || `Lote ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    const datos: LoteLocal = {
      predioIdentificador: identificador,
      nombre,
      areaHa,
      geometria,
      usoActual: borrador.usoActual.trim() || undefined,
      cobertura: borrador.cobertura.trim() || undefined,
      notas: borrador.notas.trim() || undefined,
      fechaActualizacion,
      estadoSincronizacion: 'pendiente',
    };
    if (borrador.loteId) {
      const anterior = lotes.find((l) => l.id === borrador.loteId);
      await baseDatos.lotes.put({ ...anterior, ...datos, id: borrador.loteId });
      seleccionarLote(borrador.loteId);
    } else {
      const nuevoId = await baseDatos.lotes.add(datos);
      seleccionarLote(nuevoId);
    }
    await cargarLotes();
    finalizarDibujo();
    fijarMensaje(`${nombre} guardado offline: ${formatearArea(areaHa)}.`);
    setSenalAjuste((v) => v + 1);
  };

  const mapaBase = BASES_MAPA.find((b) => b.id === base) ?? BASES_MAPA[0];
  const problemaBorrador = borrador ? motivoPoligonoInvalido(borrador.puntos) : null;
  const poligonoBorrador = borrador ? poligonoDesdePuntos(borrador.puntos) : null;
  const areaBorrador = poligonoBorrador ? areaHaPoligono(poligonoBorrador) : 0;
  const perimetroBorrador = poligonoBorrador ? perimetroMPoligono(poligonoBorrador) : 0;

  return (
    <div className="relative w-full overflow-hidden border" style={{ height: altura, borderColor: 'var(--borde)' }}>
      <MapContainer
        center={CENTRO_INICIAL}
        zoom={14}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        attributionControl
      >
        <CapturarMapa alListo={setMapa} />
        <RastreadorMapa alCambiar={cambiarCoordenada} />
        <TileLayer
          key={mapaBase.id}
          url={mapaBase.url}
          attribution={mapaBase.attribution}
          maxZoom={mapaBase.maxZoom}
          {...(mapaBase.subdominios ? { subdomains: mapaBase.subdominios } : {})}
        />
        <CapasWmsIgac activas={capasActivas} opacidad={opacidad} />

        <CapasProyecto
          predio={predioLocal}
          lotes={lotes}
          loteSeleccionadoId={loteSeleccionadoId}
          puntos={puntos}
          capasOffline={capasOffline}
          capasActivas={capasActivas}
          mostrarOffline={!enLinea}
          edicionActiva={modo !== 'explorar'}
          alSeleccionarLote={seleccionarLote}
        />

        {(modo === 'dibujar' || modo === 'punto') && (
          <ToquesMapa alAgregar={modo === 'punto' ? colocarPunto : agregarPunto} />
        )}
        {borrador && <EditorBorrador borrador={borrador} alMover={moverPunto} />}
        {puntoBorrador && <EditorPunto punto={puntoBorrador} alMover={moverPuntoBorrador} />}
      </MapContainer>

      <ControlesMapa
        lotes={lotes}
        precision={precision}
        problemaBorrador={problemaBorrador}
        areaBorrador={areaBorrador}
        perimetroBorrador={perimetroBorrador}
        alGps={agregarConGps}
        alGuardar={() => void guardar()}
        alGuardarPunto={() => void guardarPunto()}
        alRecentrar={() => setSenalAjuste((v) => v + 1)}
      />

      <BarraEstadoMapa
        lat={coordenada.lat}
        lng={coordenada.lng}
        zoom={coordenada.zoom}
        lotes={lotes.length}
        puntos={puntos.length}
        vertices={borrador?.puntos.length ?? null}
        precision={precision}
        mensaje={mensaje || mensajeGps}
        enLinea={enLinea}
      />

      <div
        className="absolute right-3 top-3 flex flex-col gap-1"
        style={{ zIndex: 901 }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setSenalAjuste((v) => v + 1)}
          className="boton-campo bg-[var(--sup)] border px-2 py-2 text-xs font-semibold shadow"
          style={{ borderColor: 'var(--borde)', color: 'var(--texto)' }}
          aria-label="Recentrar en el predio y sus lotes"
        >
          ◎
        </button>
        <button
          type="button"
          onClick={() => alternarCapa('igac-agrologia')}
          className="boton-campo bg-[var(--sup)] border px-2 py-2 text-[10px] font-semibold shadow"
          style={{
            borderColor: 'var(--borde)',
            color: capasActivas.includes('igac-agrologia') ? 'var(--acento-fuerte)' : 'var(--muted)',
          }}
          aria-label="Alternar capa de suelos IGAC"
        >
          Suelo
        </button>
        <button
          type="button"
          onClick={() => alternarCapa('igac-predial')}
          className="boton-campo bg-[var(--sup)] border px-2 py-2 text-[10px] font-semibold shadow"
          style={{
            borderColor: 'var(--borde)',
            color: capasActivas.includes('igac-predial') ? 'var(--acento-fuerte)' : 'var(--muted)',
          }}
          aria-label="Alternar capa catastral IGAC"
        >
          Catastro
        </button>
      </div>
    </div>
  );
}
