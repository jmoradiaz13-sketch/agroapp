import { RANGOS_VALIDADOS, semaforoPara } from '../datos/rangos';
import type { Hallazgo, PuntajeSalud } from '../esquemas/diagnostico';

// Espejo offline del motor backend (aplicacion/servicios/motor_diagnostico.py).
// Misma regla honesta: óptimo 90, exceso 50, deficiente 40, promedio 0-100.
export const FUENTE_SALUD = 'guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.12-18';
export const FUENTE_RUSLE = 'Copernicus GLO-30 + ficha VSA de campo (A = R·K·LS·C·P)';

export function puntajeLocal(hallazgos: Hallazgo[]): PuntajeSalud {
  if (hallazgos.length === 0) {
    return {
      puntaje: 0, nivel: 'sin-datos', detalle: 'Sin parámetros con dato: registra la ficha de laboratorio.',
      n_optimo: 0, n_total: 0, fuente: FUENTE_SALUD,
    };
  }
  const puntos = hallazgos.map((h) => (h.estado === 'optimo' ? 90 : h.estado === 'exceso' ? 50 : 40));
  const promedio = Math.round(puntos.reduce((a, b) => a + b, 0) / puntos.length);
  const nOptimo = hallazgos.filter((h) => h.estado === 'optimo').length;
  if (promedio >= 80) return { puntaje: promedio, nivel: 'bueno', detalle: 'Suelo sano y estructurado: mantén cobertura y rotación.', n_optimo: nOptimo, n_total: hallazgos.length, fuente: FUENTE_SALUD };
  if (promedio >= 60) return { puntaje: promedio, nivel: 'moderado', detalle: 'Condición moderada: corrige los parámetros en rojo/amarillo.', n_optimo: nOptimo, n_total: hallazgos.length, fuente: FUENTE_SALUD };
  return { puntaje: promedio, nivel: 'pobre', detalle: 'Condición pobre: prioriza MO, cal y cobertura antes de sembrar.', n_optimo: nOptimo, n_total: hallazgos.length, fuente: FUENTE_SALUD };
}

// Normaliza cada hallazgo a 0-100 para el radar (no mezcla % con mg/kg).
export function normalizarParaRadar(hallazgos: Hallazgo[]): { parametro: string; puntaje: number; estado: Hallazgo['estado'] }[] {
  return hallazgos.map((h) => ({
    parametro: h.parametro.replace('_pct', '').replace('_mg_kg', '').replace('_cmol_kg', '').replace('_ds_m', '').slice(0, 12),
    puntaje: h.estado === 'optimo' ? 90 : h.estado === 'exceso' ? 50 : 40,
    estado: h.estado,
  }));
}

export function colorEstado(estado: Hallazgo['estado']): string {
  if (estado === 'optimo') return '#14736E';
  if (estado === 'deficiente') return '#dc2626';
  return '#f59e0b';
}

export function etiquetaSemaforo(parametro: string, valor: number | undefined): string {
  const rango = RANGOS_VALIDADOS.find((r) => r.parametro === parametro);
  if (!rango) return 'Sin rango validado';
  const s = semaforoPara(rango, valor);
  if (s === 'optimo') return 'Óptimo';
  if (s === 'bajo') return 'Bajo';
  if (s === 'alto') return 'Alto';
  return 'Sin dato';
}

// RUSLE offline (misma fórmula del backend, valores del técnico).
const P_POR_PRACTICA: Record<string, number> = {
  sin_practicas: 1.0, curvas_nivel: 0.6, terrazas: 0.4, cobertura_permanente: 0.3, bosque_restaurado: 0.1,
};

export function factorLsOffline(pendientePct: number, longitudM = 50): number {
  const m = pendientePct >= 5 ? 0.5 : pendientePct >= 3 ? 0.4 : 0.3;
  const ele = Math.pow(longitudM / 22.13, m);
  const theta = Math.atan(pendientePct / 100);
  const ese = pendientePct < 9 ? 10.8 * Math.sin(theta) + 0.03 : 16.8 * Math.sin(theta) - 0.5;
  return Math.round(ele * ese * 100) / 100;
}

export function factorCOffline(coberturaPct: number): number {
  const c = Math.max(0.01, Math.pow(1 - coberturaPct / 100, 1.5));
  return Math.round(c * 1000) / 1000;
}

export function nivelRiesgoOffline(perdida: number): { nivel: string; semaforo: string } {
  if (perdida < 5) return { nivel: 'bajo', semaforo: 'verde' };
  if (perdida < 15) return { nivel: 'moderado', semaforo: 'amarillo' };
  if (perdida <= 50) return { nivel: 'severo', semaforo: 'naranja' };
  return { nivel: 'critico', semaforo: 'rojo' };
}

export function estimarRusleOffline(r: number, k: number, pendientePct: number, longitudM: number, coberturaPct: number, practica: string): number {
  const ls = factorLsOffline(pendientePct, longitudM);
  const c = factorCOffline(coberturaPct);
  const p = P_POR_PRACTICA[practica] ?? 1.0;
  return Math.round(r * k * ls * c * p * 10) / 10;
}

export const PRACTICAS_RUSLE = [
  { id: 'sin_practicas', etiqueta: 'Sin prácticas (P=1.0)' },
  { id: 'curvas_nivel', etiqueta: 'Curvas a nivel (P=0.6)' },
  { id: 'terrazas', etiqueta: 'Terrazas (P=0.4)' },
  { id: 'cobertura_permanente', etiqueta: 'Cobertura permanente (P=0.3)' },
  { id: 'bosque_restaurado', etiqueta: 'Bosque restaurado (P=0.1)' },
];
