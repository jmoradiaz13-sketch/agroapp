import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { Boton, BotonSecundario } from '../componentes/ui/Boton';
import { MapaTrabajo } from '../componentes/sig/MapaTrabajo';
import { PanelCapasSig } from '../componentes/sig/PanelCapasSig';
import { PanelLotesSig } from '../componentes/sig/PanelLotesSig';
import { PanelAnalisisSig } from '../componentes/sig/PanelAnalisisSig';
import { baseDatos, etiquetaCache, type LoteLocal } from '../base_datos/local';
import { bboxDePoligono, bboxTexto } from '../servicios/geo';
import {
  BBOX_PREDETERMINADO,
  obtenerGeojsonIgac,
  solicitarPrecarga,
} from '../servicios/sig';
import { usoFlujo } from '../estado/usoFlujo';
import { usoPredio } from '../estado/usoPredio';
import { usoMapaSIG } from '../estado/usoMapaSIG';

// Taller SIG map-first: el mapa es la herramienta principal y los paneles
// acompañan el flujo Seleccionar predio → Delimitar/ver lotes → Consultar.
export function SigRestauracion() {
  const { predioIdentificador } = usoFlujo();
  const { fechaCache } = usoPredio();
  const { hash } = useLocation();
  const id = predioIdentificador ?? 'finca-mirador';
  const {
    capasActivas,
    opacidad,
    mensaje,
    alternarCapa,
    fijarOpacidad,
    fijarMensaje,
  } = usoMapaSIG();

  const [cargando, setCargando] = useState(false);
  const [guardadas, setGuardadas] = useState<Record<string, string>>({});
  const [lotes, setLotes] = useState<LoteLocal[]>([]);

  const alCambiarLotes = useCallback((lista: LoteLocal[]) => setLotes(lista), []);

  // Capas IGAC del panel -> nombreCapa en Dexie capasIgac.
  const MAPA_DEXIE: [string, string][] = [
    ['igac-agrologia', 'agrologia'],
    ['igac-predial', 'predial'],
  ];

  const cargarGuardadas = useCallback(async () => {
    const filas = await baseDatos.capasIgac.where('predioIdentificador').equals(id).toArray();
    const fechas: Record<string, string> = {};
    for (const f of filas) {
      const idCapa = MAPA_DEXIE.find(([, dexie]) => dexie === f.nombreCapa)?.[0];
      if (idCapa) fechas[idCapa] = f.fechaActualizacion.slice(0, 10);
    }
    setGuardadas(fechas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    void cargarGuardadas();
  }, [cargarGuardadas]);

  // Los submenús «Mapa y capas» y «Análisis territorial» llegan con hash:
  // desplazamos al panel correspondiente dentro del taller SIG.
  useEffect(() => {
    if (!hash) return;
    const destino = document.getElementById(hash.slice(1));
    destino?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  const bboxPrecarga = async () => {
    const seleccion = usoMapaSIG.getState().loteSeleccionadoId;
    const lote = lotes.find((l) => l.id === seleccion);
    if (lote) return bboxTexto(bboxDePoligono(lote.geometria));
    const predio = await baseDatos.predios.where('identificador').equals(id).first();
    if (predio) return bboxTexto(bboxDePoligono(predio.geometria));
    return BBOX_PREDETERMINADO;
  };

  const precargar = async () => {
    setCargando(true);
    fijarMensaje('Solicitando plan de precarga al servidor…');
    const bbox = await bboxPrecarga();
    const resultado = await solicitarPrecarga(id, bbox, ['agrologia', 'predial']);
    if (!resultado.ok || !resultado.plan) {
      fijarMensaje(resultado.error ?? 'Sin conexión: anota las capas y precarga con wifi en oficina.');
      setCargando(false);
      return;
    }
    let guardadasOk = 0;
    const hoy = new Date().toISOString().slice(0, 10);
    for (const [, nombreDexie] of MAPA_DEXIE) {
      const resp = await obtenerGeojsonIgac(nombreDexie, bbox, 'real');
      const geojson = resp.ok ? (resp.geojson as GeoJSON.GeoJsonObject | undefined) : undefined;
      if (geojson) {
        await baseDatos.capasIgac.where({ predioIdentificador: id, nombreCapa: nombreDexie }).delete();
        await baseDatos.capasIgac.add({
          predioIdentificador: id,
          nombreCapa: nombreDexie,
          geojson,
          fechaActualizacion: new Date().toISOString(),
        });
        guardadasOk += 1;
      }
    }
    await cargarGuardadas();
    fijarMensaje(
      guardadasOk > 0
        ? `Precarga lista para ${id}: ${resultado.plan.peso_total_mb} MB (límite 200) · ${guardadasOk} capas guardadas el ${hoy}.`
        : 'Plan recibido pero sin geometrías reales: reintenta con wifi en oficina.',
    );
    setCargando(false);
  };

  return (
    <div className="grid gap-3 animacion-entrada">
      <EncabezadoPagina
        kicker="SIG · Taller de campo"
        titulo="Delimita, consulta y decide sobre el mapa"
        descripcion="Predio, lotes y puntos sobre capas oficiales IGAC. Edición offline y precarga para llevar al campo."
        acciones={
          <>
            <Boton onClick={() => void precargar()} disabled={cargando} className="!bg-[#059669] hover:!bg-[#047857]">
              {cargando ? 'Precargando…' : 'Precargar para campo'}
            </Boton>
            <Link to="/lote">
              <BotonSecundario>Caracterizar lotes →</BotonSecundario>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs px-1" style={{ color: 'var(--muted)' }}>
        <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--texto)' }}>
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" aria-hidden />
          {id} · offline-first
        </span>
        <span>{fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'}</span>
        <span>Máx 200 MB por predio</span>
        <span>WMS IGAC requiere red; GeoJSON precargado respalda el campo.</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div id="mapa" className="grid gap-3 content-start min-w-0 scroll-mt-24">
          <MapaTrabajo identificador={id} alCambiarLotes={alCambiarLotes} />
          <Tarjeta titulo="Del mapa a la acción">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Delimita el predio y sus lotes; después consulta pendiente, RUSLE, NDVI y frontera agrícola en el panel
              de análisis. Todo lo guardado viaja en Dexie y queda pendiente de sincronizar.
            </p>
            <div className="flex gap-2 flex-wrap mt-3">
              <Link to="/lote"><BotonSecundario>Ir a lotes →</BotonSecundario></Link>
              <Link to="/suelos?vista=ficha" className="boton-campo inline-flex items-center px-3 py-2 font-semibold text-sm underline underline-offset-4" style={{ color: 'var(--acento-fuerte)' }}>
                Registrar ficha VSA →
              </Link>
              <Link to="/suelos?vista=lectura" className="boton-campo inline-flex items-center px-3 py-2 font-semibold text-sm underline underline-offset-4" style={{ color: 'var(--acento-fuerte)' }}>
                Ver diagnóstico →
              </Link>
            </div>
          </Tarjeta>
        </div>

        <aside className="grid gap-3 content-start min-w-0 lg:sticky lg:top-4">
          <PanelLotesSig lotes={lotes} mensaje={mensaje} />
          <Tarjeta titulo="Capas oficiales">
            <PanelCapasSig activas={capasActivas} alCambiar={alternarCapa} guardadas={guardadas} />
            <label className="etiqueta-campo mt-3">
              Opacidad de capas IGAC ({Math.round(opacidad * 100)} %)
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={opacidad}
                onChange={(e) => fijarOpacidad(Number(e.target.value))}
                className="w-full accent-[#059669] min-h-[44px]"
                aria-label="Opacidad de capas IGAC"
              />
            </label>
          </Tarjeta>
          <div id="analisis" className="scroll-mt-24">
            <PanelAnalisisSig id={id} lotes={lotes} alCambiarLotes={alCambiarLotes} />
          </div>
        </aside>
      </div>
    </div>
  );
}
