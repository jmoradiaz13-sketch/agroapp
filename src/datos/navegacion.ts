// Navegación horizontal por grupos (estilo Genially/Tec): la barra superior
// agrupa escenas; el Tablero (/) es la puerta de entrada. En móvil mandan
// el header compacto + TABS_MOVIL. Iconos de línea propios, uso libre.
import type { IconoId } from '../componentes/Iconos';

export interface ItemNav {
  id: string;
  ruta: string;
  titulo: string;
  icono: IconoId;
}

export interface GrupoNav {
  id: string;
  titulo: string;
  items: ItemNav[];
}

export const MENU_VERDE: ItemNav[] = [
  { id: 'inicio', ruta: '/', titulo: 'Tablero', icono: 'dashboard' },
  { id: 'predios', ruta: '/predios', titulo: 'Predios', icono: 'predios' },
  { id: 'lote', ruta: '/lote', titulo: 'Lotes', icono: 'lotes' },
  { id: 'ficha', ruta: '/suelos', titulo: 'Suelos', icono: 'suelos' },
  { id: 'sig', ruta: '/sig', titulo: 'SIG', icono: 'sig' },
  { id: 'simulador', ruta: '/simulador', titulo: 'Simulador', icono: 'simulador' },
  { id: 'diseno', ruta: '/diseno', titulo: 'Diseño SAF', icono: 'diseno' },
  { id: 'informe', ruta: '/informe', titulo: 'Informe', icono: 'informe' },
  { id: 'biblioteca', ruta: '/biblioteca', titulo: 'Biblioteca', icono: 'biblioteca' },
];

const POR_ID: Record<string, ItemNav> = Object.fromEntries(MENU_VERDE.map((m) => [m.id, m]));

// Grupos del menú horizontal (5, como las secciones del referente).
export const GRUPOS_NAV: GrupoNav[] = [
  { id: 'finca', titulo: 'Finca', items: [POR_ID.predios, POR_ID.lote] },
  { id: 'suelo', titulo: 'Suelo', items: [POR_ID.ficha] },
  { id: 'territorio', titulo: 'Territorio', items: [POR_ID.sig] },
  { id: 'plan', titulo: 'Plan', items: [POR_ID.simulador, POR_ID.diseno, POR_ID.informe] },
  { id: 'aprende', titulo: 'Aprende', items: [POR_ID.biblioteca] },
];

export const TABS_MOVIL: ItemNav[] = [
  { id: 'inicio', ruta: '/', titulo: 'Finca', icono: 'predios' },
  { id: 'ficha', ruta: '/suelos', titulo: 'Suelo', icono: 'suelos' },
  { id: 'sig', ruta: '/sig', titulo: 'Mapa', icono: 'sig' },
  { id: 'simulador', ruta: '/simulador', titulo: 'Plan', icono: 'simulador' },
];

export const TITULOS_RUTA: Record<string, string> = {
  '/': 'Tablero',
  '/predios': 'Predios',
  '/lote': 'Lotes',
  '/suelos': 'Suelos',
  '/ficha': 'Suelos',
  '/suelo-historial': 'Suelos',
  '/sig': 'SIG · Restauración',
  '/simulador': 'Simulador',
  '/diseno': 'Diseño',
  '/diagnostico': 'Diagnóstico',
  '/informe': 'Informe',
  '/ingreso': 'Ingreso',
  '/biblioteca': 'Biblioteca',
};
