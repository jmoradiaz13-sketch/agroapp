import { baseDatos } from '../base_datos/local';

// Asistente lineal de 7 etapas (Plan Maestro §4): cada etapa mide avance
// real con datos Dexie del predio. Sin datos no hay avance (cero invención).
export interface Etapa {
  id: number;
  titulo: string;
  ruta: string;
  avance: number; // 0-100
  detalle: string;
}

export async function calcularEtapas(predioIdentificador: string | null): Promise<{ etapas: Etapa[]; total: number }> {
  const vacias: Etapa[] = [
    { id: 1, titulo: 'Predio', ruta: '/predios', avance: 0, detalle: 'Sin predio' },
    { id: 2, titulo: 'Lotes', ruta: '/lote', avance: 0, detalle: 'Sin lotes' },
    { id: 3, titulo: 'Suelos', ruta: '/ficha', avance: 0, detalle: 'Sin fichas' },
    { id: 4, titulo: 'SIG', ruta: '/sig', avance: 0, detalle: 'Sin capas precargadas' },
    { id: 5, titulo: 'Diagnóstico', ruta: '/diagnostico', avance: 0, detalle: 'Sin diagnóstico' },
    { id: 6, titulo: 'Plan', ruta: '/simulador', avance: 0, detalle: 'Sin escenarios ni diseños' },
    { id: 7, titulo: 'Monitoreo', ruta: '/informe', avance: 0, detalle: 'Sin monitoreo' },
  ];
  if (!predioIdentificador) return { etapas: vacias, total: 0 };

  const [predio, lotes, fichas, capas, disenos, escenarios, monitoreos] = await Promise.all([
    baseDatos.predios.where('identificador').equals(predioIdentificador).first(),
    baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).toArray(),
    baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).toArray(),
    baseDatos.capasIgac.where('predioIdentificador').equals(predioIdentificador).toArray(),
    baseDatos.disenos.where('predioIdentificador').equals(predioIdentificador).toArray(),
    baseDatos.escenarios.where('predioIdentificador').equals(predioIdentificador).toArray(),
    baseDatos.monitoreos.toArray(),
  ]);

  const etapas = vacias;
  if (predio) {
    etapas[0] = { ...etapas[0], avance: 100, detalle: predio.nombre };
  }
  if (lotes.length > 0) {
    const area = lotes.reduce((a, l) => a + (l.areaHa ?? 0), 0);
    etapas[1] = { ...etapas[1], avance: 100, detalle: `${lotes.length} lotes · ${area.toFixed(1)} ha` };
  }
  if (fichas.length > 0) {
    etapas[2] = { ...etapas[2], avance: 100, detalle: `${fichas.length} fichas (v${fichas.length})` };
  }
  if (capas.length > 0) {
    etapas[3] = { ...etapas[3], avance: 100, detalle: `${capas.length} capas offline` };
  } else if (lotes.length > 0) {
    etapas[3] = { ...etapas[3], avance: 30, detalle: 'Precarga pendiente en /sig' };
  }
  if (fichas.length > 0) {
    const conPendiente = lotes.some((l) => l.pendientePct !== undefined);
    etapas[4] = {
      ...etapas[4],
      avance: conPendiente ? 100 : 60,
      detalle: conPendiente ? 'Fichas + pendiente DEM' : 'Fichas sin pendiente DEM',
    };
  }
  if (disenos.length > 0 || escenarios.length > 0) {
    etapas[5] = { ...etapas[5], avance: 100, detalle: `${escenarios.length} escenarios · ${disenos.length} diseños` };
  }
  if (monitoreos.length > 0) {
    etapas[6] = { ...etapas[6], avance: 100, detalle: `${monitoreos.length} registros` };
  } else if (disenos.length > 0 || escenarios.length > 0) {
    etapas[6] = { ...etapas[6], avance: 30, detalle: 'Plan sin monitoreo aún' };
  }

  const total = Math.round(etapas.reduce((a, e) => a + e.avance, 0) / etapas.length);
  return { etapas, total };
}
