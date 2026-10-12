import { baseDatos } from '../base_datos/local';

// Exportación para el perfil investigador (Plan §3): GeoJSON de geometrías
// y CSV de fichas/puntos, generados en el dispositivo desde Dexie.
function descargar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function aCsv(filas: Record<string, unknown>[]): string {
  if (filas.length === 0) return '';
  const cols = Object.keys(filas[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...filas.map((f) => cols.map((c) => esc(f[c])).join(','))].join('\n');
}

export async function exportarPredioGeoJSON(predioIdentificador: string): Promise<string> {
  const predio = await baseDatos.predios.where('identificador').equals(predioIdentificador).first();
  const lotes = await baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).toArray();
  const puntos = await baseDatos.puntosMuestreo.where('predioIdentificador').equals(predioIdentificador).toArray();
  const features: unknown[] = [];
  if (predio) {
    features.push({
      type: 'Feature',
      properties: { tipo: 'predio', nombre: predio.nombre, identificador: predio.identificador },
      geometry: predio.geometria,
    });
  }
  for (const l of lotes) {
    features.push({
      type: 'Feature',
      properties: { tipo: 'lote', nombre: l.nombre, areaHa: l.areaHa ?? null, pendientePct: l.pendientePct ?? null },
      geometry: l.geometria,
    });
  }
  for (const p of puntos) {
    features.push({
      type: 'Feature',
      properties: { tipo: 'punto_muestreo', codigo: p.codigo, lote: p.loteNombre ?? null },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    });
  }
  const geojson = JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
  descargar(`${predioIdentificador}.geojson`, geojson, 'application/geo+json');
  return `${features.length} geometrías en ${predioIdentificador}.geojson (WGS84).`;
}

export async function exportarFichasCSV(predioIdentificador: string): Promise<string> {
  const fichas = await baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).toArray();
  if (fichas.length === 0) return 'Sin fichas para exportar en este predio.';
  const filas = fichas.map((f) => ({
    version: f.version,
    fecha: f.fecha,
    ph_agua: f.phAgua ?? '',
    materia_organica_pct: f.materiaOrganicaPct ?? '',
    nitrogeno_pct: f.nitrogenoPct ?? '',
    fosforo_mg_kg: f.fosforoMgKg ?? '',
    metodo_fosforo: f.metodoFosforo ?? '',
    potasio_cmol_kg: f.potasioCmolKg ?? '',
    calcio_cmol_kg: f.calcioCmolKg ?? '',
    magnesio_cmol_kg: f.magnesioCmolKg ?? '',
    aluminio_cmol_kg: f.aluminioCmolKg ?? '',
    cic_cmol_kg: f.cicCmolKg ?? '',
    arena_pct: f.arenaPct ?? '',
    limo_pct: f.limoPct ?? '',
    arcilla_pct: f.arcillaPct ?? '',
    densidad_aparente: f.densidadAparente ?? '',
    densidad_real: f.densidadReal ?? '',
    estructura_vess: f.estructuraVess ?? '',
    lombrices: f.lombricesConteo ?? '',
    cobertura_pct: f.coberturaVegetalPct ?? '',
    referencia: f.referenciaBibliografica ?? '',
  }));
  descargar(`${predioIdentificador}-fichas.csv`, aCsv(filas), 'text/csv');
  return `${filas.length} fichas en ${predioIdentificador}-fichas.csv (unidades §2.2).`;
}
