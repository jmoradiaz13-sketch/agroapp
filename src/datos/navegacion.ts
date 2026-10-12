// Navegación única PC/móvil (ref_1 sidebar + ref_2 bottom tabs).
// El sidebar usa estos ítems; la barra inferior móvil usa los 4 de TABS_MOVIL.
export interface ItemNav {
  id: string;
  ruta: string;
  titulo: string;
  icono: string;
}

export const MENU_VERDE: ItemNav[] = [
  { id: 'inicio', ruta: '/', titulo: 'Dashboard', icono: '📊' },
  { id: 'predios', ruta: '/predios', titulo: 'Predios', icono: '🏡' },
  { id: 'lote', ruta: '/lote', titulo: 'Lotes', icono: '🗺' },
  { id: 'ficha', ruta: '/ficha', titulo: 'Suelos', icono: '🧪' },
  { id: 'sig', ruta: '/sig', titulo: 'SIG', icono: '🛰' },
  { id: 'simulador', ruta: '/simulador', titulo: 'Simulador', icono: '⚗' },
  { id: 'diseno', ruta: '/diseno', titulo: 'Diseño', icono: '🌳' },
  { id: 'diagnostico', ruta: '/diagnostico', titulo: 'Diagnóstico', icono: '📈' },
  { id: 'informe', ruta: '/informe', titulo: 'Informe', icono: '📄' },
  { id: 'biblioteca', ruta: '/biblioteca', titulo: 'Biblioteca', icono: '📚' },
];

export const TABS_MOVIL: ItemNav[] = [
  { id: 'inicio', ruta: '/', titulo: 'Finca', icono: '🏡' },
  { id: 'ficha', ruta: '/ficha', titulo: 'Suelo', icono: '🧪' },
  { id: 'sig', ruta: '/sig', titulo: 'Mapa SIG', icono: '🛰' },
  { id: 'simulador', ruta: '/simulador', titulo: 'Plan', icono: '🌱' },
];

export interface Herramienta {
  titulo: string;
  ruta?: string;
  insignia: string;
  proximo?: boolean;
}

// Fila de herramientas por conectividad (AGENTS §4).
export const MENU_NEGRO: Herramienta[] = [
  { titulo: 'Mapa GPS', ruta: '/lote', insignia: 'OFFLINE' },
  { titulo: 'Análisis VSA', ruta: '/ficha', insignia: 'OFFLINE' },
  { titulo: 'Análisis lab', ruta: '/ficha', insignia: 'OFFLINE' },
  { titulo: 'Monitoreo', ruta: '/lote', insignia: 'OFFLINE' },
  { titulo: 'Pendiente / RUSLE', ruta: '/sig', insignia: 'MIXTO' },
  { titulo: 'Capas IGAC', ruta: '/sig', insignia: 'MIXTO' },
  { titulo: 'NDVI satelital', ruta: '/sig', insignia: 'ONLINE' },
  { titulo: 'Simulador', ruta: '/simulador', insignia: 'MIXTO' },
];

export const TITULOS_RUTA: Record<string, string> = {
  '/': 'Dashboard',
  '/predios': 'Predios',
  '/lote': 'Lotes',
  '/ficha': 'Análisis de suelos',
  '/sig': 'SIG · Restauración',
  '/simulador': 'Simulador',
  '/diseno': 'Diseño',
  '/diagnostico': 'Diagnóstico',
  '/informe': 'Informe',
  '/ingreso': 'Ingreso',
  '/biblioteca': 'Biblioteca',
};
