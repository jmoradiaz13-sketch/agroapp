import * as turf from '@turf/turf';
import { baseDatos } from '../base_datos/local';

// Seed demo Andina (Tibacuy, Cundinamarca): visible sin backend ni red.
const POLIGONO_FINCA: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[-74.46, 4.35], [-74.44, 4.35], [-74.44, 4.33], [-74.46, 4.33], [-74.46, 4.35]]]
};
const POLIGONO_CAFE: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[-74.458, 4.348], [-74.448, 4.348], [-74.448, 4.34], [-74.458, 4.34], [-74.458, 4.348]]]
};
const POLIGONO_POTRERO: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[-74.458, 4.338], [-74.448, 4.338], [-74.448, 4.332], [-74.458, 4.332], [-74.458, 4.338]]]
};

export async function sembrarDemo(): Promise<string> {
  const existentes = await baseDatos.predios.where('identificador').equals('finca-mirador').count();
  if (existentes > 0) return 'Demo ya sembrada';
  const ahora = new Date().toISOString();
  const areaFinca = turf.area(POLIGONO_FINCA) / 10000;

  await baseDatos.predios.add({
    identificador: 'finca-mirador', nombre: 'Finca El Mirador',
    propietario: 'Familia Demo', documento: '123456', contacto: '300 000 0000',
    municipio: 'Tibacuy', departamento: 'Cundinamarca', areaTotalHa: Math.round(areaFinca * 100) / 100,
    notas: 'Demo Andina sin conexión', geometria: POLIGONO_FINCA,
    fechaActualizacion: ahora, tamanoCacheBytes: 0, estadoSincronizacion: 'pendiente'
  });
  await baseDatos.lotes.bulkAdd([
    {
      predioIdentificador: 'finca-mirador', nombre: 'Lote Café', areaHa: 1.2,
      geometria: POLIGONO_CAFE, usoActual: 'café con sombrío', usosHistoricos: ['potrero', 'café'],
      pendientePct: 12, cobertura: 'semisombra', clima: 'templado 18°C', zonaVida: 'bh-MB',
      erosion: 'leve', notas: '', fechaActualizacion: ahora, estadoSincronizacion: 'pendiente'
    },
    {
      predioIdentificador: 'finca-mirador', nombre: 'Lote Potrero', areaHa: 0.8,
      geometria: POLIGONO_POTRERO, usoActual: 'potrero', usosHistoricos: ['rastrojo'],
      pendientePct: 8, cobertura: 'pasto', clima: 'templado 18°C', zonaVida: 'bh-MB',
      erosion: 'moderada', notas: '', fechaActualizacion: ahora, estadoSincronizacion: 'pendiente'
    }
  ]);
  await baseDatos.fichasSuelo.bulkAdd([
    {
      predioIdentificador: 'finca-mirador', fecha: ahora.slice(0, 10), version: 1,
      calcioCmolKg: 4.5, magnesioCmolKg: 1.2, potasioCmolKg: 0.35, fosforoMgKg: 18,
      materiaOrganicaPct: 3.4, nitrogenoPct: 0.18, conductividadDsM: 0.6,
      referenciaBibliografica: 'guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.12-18',
      sincronizada: false
    },
    {
      predioIdentificador: 'finca-mirador', fecha: ahora.slice(0, 10), version: 2,
      calcioCmolKg: 2.1, magnesioCmolKg: 0.6, potasioCmolKg: 0.15, fosforoMgKg: 9,
      materiaOrganicaPct: 1.6, nitrogenoPct: 0.08, conductividadDsM: 2.8,
      referenciaBibliografica: 'guia_de_buenas_practicas_para_la_gestion_y_uso_sostenible_de_los_suelos.pdf',
      sincronizada: false
    }
  ]);
  await baseDatos.estrategias.add({
    loteNombre: 'Lote Café', tipo: 'agroforesteria',
    especies: ['café', 'plátano', 'guamo'],
    practicas: 'Sombrío regulado + cobertura muerta',
    estado: 'propuesta', version: 1,
    referenciaBibliografica: 'saf_cacao_orinoquia.pdf',
    decisionTecnico: 'aceptada', sincronizada: false
  });
  await baseDatos.monitoreos.add({
    loteNombre: 'Lote Café', fecha: ahora.slice(0, 10),
    indicadores: { vsa: 42, cobertura_pct: 70, lombrices_m2: 85 },
    observaciones: 'Suelo friable, buena actividad biológica', sincronizada: false
  });
  return 'Demo sembrada: Finca El Mirador + 2 lotes + 2 fichas + estrategia + monitoreo';
}
