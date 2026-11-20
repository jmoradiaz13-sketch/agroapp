import { useEffect, useState } from 'react';
import type { LoteLocal } from '../../base_datos/local';
import { baseDatos } from '../../base_datos/local';
import { usoMapaSIG } from '../../estado/usoMapaSIG';
import { bboxDePoligono, bboxTexto } from '../../servicios/geo';
import {
  BBOX_PREDETERMINADO,
  estimarPendienteDem,
  estimarRusle,
  obtenerSerieNdvi,
  type EstimacionDem,
  type InterpretacionNdvi,
  type PuntoNdvi,
  type ResultadoRusle,
} from '../../servicios/sig';
import { TarjetaFrontera } from './TarjetaFrontera';
import { TarjetaPendienteDem } from './TarjetaPendienteDem';
import { TarjetaRusle } from './TarjetaRusle';
import { TarjetaSerieNdvi } from './TarjetaSerieNdvi';

type Analisis = 'relieve' | 'ndvi' | 'upra';

const ANALISIS: { id: Analisis; titulo: string }[] = [
  { id: 'relieve', titulo: 'Relieve / RUSLE' },
  { id: 'ndvi', titulo: 'NDVI' },
  { id: 'upra', titulo: 'UPRA' },
];

export function PanelAnalisisSig({
  id,
  lotes,
  alCambiarLotes,
}: {
  id: string;
  lotes: LoteLocal[];
  alCambiarLotes: (lotes: LoteLocal[]) => void;
}) {
  const { loteSeleccionadoId, fijarMensaje } = usoMapaSIG();
  const loteSel = loteSeleccionadoId ?? undefined;
  const elegirLote = (loteId: number | undefined) => usoMapaSIG.getState().seleccionarLote(loteId ?? null);

  const [analisis, setAnalisis] = useState<Analisis>('relieve');
  const [estimacion, setEstimacion] = useState<EstimacionDem | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [serie, setSerie] = useState<PuntoNdvi[] | null>(null);
  const [interp, setInterp] = useState<InterpretacionNdvi | null>(null);
  const [fuenteNdvi, setFuenteNdvi] = useState('');
  const [fechaCacheNdvi, setFechaCacheNdvi] = useState('');
  const [cargandoSerie, setCargandoSerie] = useState(false);
  const [coberturaPct, setCoberturaPct] = useState(60);
  const [longitudM, setLongitudM] = useState(50);
  const [rVal, setRVal] = useState(3000);
  const [kVal, setKVal] = useState(0.03);
  const [practica, setPractica] = useState('sin_practicas');
  const [rusle, setRusle] = useState<ResultadoRusle | null>(null);
  const [calculandoRusle, setCalculandoRusle] = useState(false);

  useEffect(() => {
    let activo = true;
    void baseDatos.analisisSig
      .where('[predioIdentificador+tipo]')
      .equals([id, 'NDVI'])
      .first()
      .then((cache) => {
        if (!activo || !cache) return;
        const datos = cache.datos as { puntos: PuntoNdvi[]; interpretacion: InterpretacionNdvi };
        setSerie(datos.puntos);
        setInterp(datos.interpretacion);
        setFuenteNdvi(cache.fuente);
        setFechaCacheNdvi(cache.fechaActualizacion);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, [id]);

  const bboxAnalisis = async () => {
    const lote = lotes.find((l) => l.id === loteSel);
    if (lote) return bboxTexto(bboxDePoligono(lote.geometria));
    const predio = await baseDatos.predios.where('identificador').equals(id).first();
    if (predio) return bboxTexto(bboxDePoligono(predio.geometria));
    return BBOX_PREDETERMINADO;
  };

  const guardarCacheNdvi = async (puntos: PuntoNdvi[], interpretacion: InterpretacionNdvi, fuente: string) => {
    const fechaActualizacion = new Date().toISOString();
    const existente = await baseDatos.analisisSig
      .where('[predioIdentificador+tipo]')
      .equals([id, 'NDVI'])
      .first();
    const datos = { puntos, interpretacion };
    if (existente?.id) {
      await baseDatos.analisisSig.update(existente.id, { datos, fuente, fechaActualizacion });
    } else {
      await baseDatos.analisisSig.add({
        predioIdentificador: id,
        tipo: 'NDVI',
        datos,
        fuente,
        fechaActualizacion,
      });
    }
    setFuenteNdvi(fuente);
    setFechaCacheNdvi(fechaActualizacion);
  };

  const recargarLotes = async () => {
    alCambiarLotes(await baseDatos.lotes.where('predioIdentificador').equals(id).toArray());
  };

  const calcularPendiente = async () => {
    setCalculando(true);
    const bbox = await bboxAnalisis();
    const resp = await estimarPendienteDem(id, bbox, 'real');
    if (resp.ok && resp.estimacion) {
      setEstimacion(resp.estimacion);
      fijarMensaje(`DEM: pendiente media ${resp.estimacion.pendiente_pct} % (${resp.estimacion.clase}). ${resp.estimacion.manejo}`);
    } else {
      fijarMensaje(resp.error ?? 'Sin DEM Copernicus: reintenta en oficina o registra la pendiente del lote.');
    }
    setCalculando(false);
  };

  const guardarPendiente = async () => {
    if (loteSel === undefined || !estimacion) return;
    await baseDatos.lotes.update(loteSel, {
      pendientePct: estimacion.pendiente_pct,
      fechaActualizacion: new Date().toISOString(),
    });
    await recargarLotes();
    const nombre = lotes.find((l) => l.id === loteSel)?.nombre ?? 'lote';
    fijarMensaje(`Pendiente ${estimacion.pendiente_pct} % guardada en ${nombre}. Viaja offline a campo.`);
  };

  const calcularRusle = async () => {
    const lote = lotes.find((l) => l.id === loteSel);
    const pendiente = estimacion?.pendiente_pct ?? lote?.pendientePct;
    if (pendiente === undefined || pendiente === null) {
      fijarMensaje('Calcula primero la pendiente DEM o registra la pendiente del lote.');
      return;
    }
    setCalculandoRusle(true);
    const resp = await estimarRusle({
      predio: id,
      pendientePct: pendiente,
      coberturaPct,
      longitudM,
      r: rVal,
      k: kVal,
      practica,
    });
    if (resp.ok && resp.resultado) {
      setRusle(resp.resultado);
      fijarMensaje(`RUSLE: ${resp.resultado.perdida_t_ha_ano} t/ha/año (${resp.resultado.clase}). ${resp.resultado.manejo}`);
    } else {
      fijarMensaje(resp.error ?? 'Sin cálculo: reintenta en oficina.');
    }
    setCalculandoRusle(false);
  };

  const guardarErosion = async () => {
    if (loteSel === undefined || !rusle) return;
    await baseDatos.lotes.update(loteSel, {
      erosion: `${rusle.clase} (RUSLE ${rusle.perdida_t_ha_ano} t/ha/año)`,
      fechaActualizacion: new Date().toISOString(),
    });
    await recargarLotes();
    fijarMensaje(`Erosión ${rusle.clase} guardada en el lote. Llévala a la ficha y al diagnóstico.`);
  };

  const cargarSerie = async () => {
    setCargandoSerie(true);
    const bbox = await bboxAnalisis();
    const resp = await obtenerSerieNdvi(id, bbox, 'real');
    if (resp.ok && resp.puntos && resp.interpretacion) {
      setSerie(resp.puntos);
      setInterp(resp.interpretacion);
      await guardarCacheNdvi(resp.puntos, resp.interpretacion, resp.fuente ?? 'Copernicus Sentinel-2 L2A');
      fijarMensaje(
        resp.interpretacion.alerta ??
          `Serie NDVI ${resp.interpretacion.tendencia} (Δ ${resp.interpretacion.delta}) desde Copernicus.`,
      );
    } else {
      fijarMensaje(resp.error ?? 'Sin serie: se muestra la última cacheada en el dispositivo.');
    }
    setCargandoSerie(false);
  };

  return (
    <div className="grid gap-3">
      <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Análisis SIG">
        {ANALISIS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={analisis === a.id}
            onClick={() => setAnalisis(a.id)}
            className="boton-campo px-3 py-2 text-xs font-semibold border min-h-[44px]"
            style={{
              background: analisis === a.id ? 'var(--acento)' : 'var(--sup)',
              color: analisis === a.id ? '#fff' : 'var(--texto)',
              borderColor: analisis === a.id ? 'var(--acento)' : 'var(--borde)',
            }}
          >
            {a.titulo}
          </button>
        ))}
      </div>

      {analisis === 'relieve' && (
        <div className="grid gap-3">
          <TarjetaPendienteDem
            predioId={id}
            lotes={lotes}
            loteSel={loteSel}
            alElegirLote={elegirLote}
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
            coberturaPct={coberturaPct}
            alCobertura={setCoberturaPct}
            longitudM={longitudM}
            alLongitud={setLongitudM}
            rVal={rVal}
            alR={setRVal}
            kVal={kVal}
            alK={setKVal}
            practica={practica}
            alPractica={setPractica}
            rusle={rusle}
            calculando={calculandoRusle}
            alCalcular={() => void calcularRusle()}
            alGuardar={() => void guardarErosion()}
          />
        </div>
      )}

      {analisis === 'ndvi' && (
        <TarjetaSerieNdvi
          serie={serie}
          interp={interp}
          fuente={fuenteNdvi}
          fechaCache={fechaCacheNdvi}
          cargando={cargandoSerie}
          alActualizar={() => void cargarSerie()}
        />
      )}

      {analisis === 'upra' && <TarjetaFrontera predioId={id} />}
    </div>
  );
}
