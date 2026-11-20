import { create } from 'zustand';
import type { LoteLocal } from '../base_datos/local';
import type { BaseMapa } from '../datos/sig';
import { puntosDesdePoligono, type Coordenada } from '../servicios/geo';

export type TipoDibujo = 'predio' | 'lote';
export type TipoPunto = 'muestra' | 'arbol' | 'agua' | 'infraestructura';

export interface PuntoBorrador {
  coordenada: Coordenada | null;
  tipo: TipoPunto;
  etiqueta: string;
}

export interface BorradorMapa {
  tipo: TipoDibujo;
  loteId?: number;
  nombre: string;
  usoActual: string;
  cobertura: string;
  notas: string;
  puntos: Coordenada[];
}

interface EstadoMapaSIG {
  base: BaseMapa;
  capasActivas: string[];
  opacidad: number;
  modo: 'explorar' | 'dibujar' | 'punto';
  borrador: BorradorMapa | null;
  puntoBorrador: PuntoBorrador | null;
  loteSeleccionadoId: number | null;
  mensaje: string;
  fijarBase: (base: BaseMapa) => void;
  alternarCapa: (id: string) => void;
  fijarOpacidad: (opacidad: number) => void;
  seleccionarLote: (id: number | null) => void;
  iniciarDibujoPredio: () => void;
  iniciarDibujoLote: () => void;
  editarLote: (lote: LoteLocal) => void;
  agregarPunto: (punto: Coordenada) => void;
  moverPunto: (indice: number, punto: Coordenada) => void;
  quitarPunto: (indice: number) => void;
  quitarUltimo: () => void;
  actualizarBorrador: (cambios: Partial<Pick<BorradorMapa, 'nombre' | 'usoActual' | 'cobertura' | 'notas'>>) => void;
  cancelarDibujo: () => void;
  finalizarDibujo: () => void;
  iniciarPunto: () => void;
  colocarPunto: (coordenada: Coordenada) => void;
  moverPuntoBorrador: (coordenada: Coordenada) => void;
  actualizarPunto: (cambios: Partial<Pick<PuntoBorrador, 'tipo' | 'etiqueta'>>) => void;
  cancelarPunto: () => void;
  finalizarPunto: () => void;
  fijarMensaje: (mensaje: string) => void;
  reiniciar: () => void;
}

const CAPAS_INICIALES = ['igac-agrologia'];

export const usoMapaSIG = create<EstadoMapaSIG>((fijar) => ({
  base: 'osm',
  capasActivas: CAPAS_INICIALES,
  opacidad: 0.5,
  modo: 'explorar',
  borrador: null,
  puntoBorrador: null,
  loteSeleccionadoId: null,
  mensaje: '',

  fijarBase: (base) => fijar({ base }),
  alternarCapa: (id) =>
    fijar((estado) => ({
      capasActivas: estado.capasActivas.includes(id)
        ? estado.capasActivas.filter((c) => c !== id)
        : [...estado.capasActivas, id],
    })),
  fijarOpacidad: (opacidad) => fijar({ opacidad }),
  seleccionarLote: (id) => fijar({ loteSeleccionadoId: id }),

  iniciarDibujoPredio: () =>
    fijar({
      modo: 'dibujar',
      puntoBorrador: null,
      loteSeleccionadoId: null,
      borrador: {
        tipo: 'predio',
        nombre: 'Predio',
        usoActual: '',
        cobertura: '',
        notas: '',
        puntos: [],
      },
      mensaje: 'Toca el mapa o usa GPS para marcar el perímetro del predio.',
    }),

  iniciarDibujoLote: () =>
    fijar({
      modo: 'dibujar',
      puntoBorrador: null,
      loteSeleccionadoId: null,
      borrador: {
        tipo: 'lote',
        nombre: '',
        usoActual: '',
        cobertura: '',
        notas: '',
        puntos: [],
      },
      mensaje: 'Toca el mapa para agregar vértices. Usa GPS para caminar el lindero.',
    }),

  editarLote: (lote) =>
    fijar({
      modo: 'dibujar',
      puntoBorrador: null,
      loteSeleccionadoId: lote.id ?? null,
      borrador: {
        tipo: 'lote',
        loteId: lote.id,
        nombre: lote.nombre,
        usoActual: lote.usoActual ?? '',
        cobertura: lote.cobertura ?? '',
        notas: lote.notas ?? '',
        puntos: puntosDesdePoligono(lote.geometria),
      },
      mensaje: `Editando ${lote.nombre}. Arrastra los vértices para corregir el lindero.`,
    }),

  agregarPunto: (punto) =>
    fijar((estado) => {
      if (!estado.borrador) return estado;
      return { borrador: { ...estado.borrador, puntos: [...estado.borrador.puntos, punto] } };
    }),

  moverPunto: (indice, punto) =>
    fijar((estado) => {
      if (!estado.borrador || indice < 0 || indice >= estado.borrador.puntos.length) return estado;
      const puntos = estado.borrador.puntos.map((p, i) => (i === indice ? punto : p));
      return { borrador: { ...estado.borrador, puntos } };
    }),

  quitarPunto: (indice) =>
    fijar((estado) => {
      if (!estado.borrador) return estado;
      return { borrador: { ...estado.borrador, puntos: estado.borrador.puntos.filter((_, i) => i !== indice) } };
    }),

  quitarUltimo: () =>
    fijar((estado) => {
      if (!estado.borrador || estado.borrador.puntos.length === 0) return estado;
      return { borrador: { ...estado.borrador, puntos: estado.borrador.puntos.slice(0, -1) } };
    }),

  actualizarBorrador: (cambios) =>
    fijar((estado) => {
      if (!estado.borrador) return estado;
      return { borrador: { ...estado.borrador, ...cambios } };
    }),

  iniciarPunto: () =>
    fijar({
      modo: 'punto',
      borrador: null,
      puntoBorrador: { coordenada: null, tipo: 'muestra', etiqueta: '' },
      mensaje: 'Toca el mapa o usa GPS para ubicar el punto.',
    }),

  colocarPunto: (coordenada) =>
    fijar((estado) =>
      estado.modo === 'punto'
        ? { puntoBorrador: { ...(estado.puntoBorrador ?? { tipo: 'muestra', etiqueta: '' }), coordenada } }
        : estado,
    ),

  moverPuntoBorrador: (coordenada) =>
    fijar((estado) => (estado.puntoBorrador ? { puntoBorrador: { ...estado.puntoBorrador, coordenada } } : estado)),

  actualizarPunto: (cambios) =>
    fijar((estado) => (estado.puntoBorrador ? { puntoBorrador: { ...estado.puntoBorrador, ...cambios } } : estado)),

  cancelarPunto: () => fijar({ modo: 'explorar', puntoBorrador: null, mensaje: 'Punto cancelado.' }),
  finalizarPunto: () => fijar({ modo: 'explorar', puntoBorrador: null }),

  cancelarDibujo: () => fijar({ modo: 'explorar', borrador: null, mensaje: 'Edición cancelada.' }),
  finalizarDibujo: () => fijar({ modo: 'explorar', borrador: null }),
  fijarMensaje: (mensaje) => fijar({ mensaje }),
  reiniciar: () =>
    fijar({
      base: 'osm',
      capasActivas: CAPAS_INICIALES,
      opacidad: 0.5,
      modo: 'explorar',
      borrador: null,
      puntoBorrador: null,
      loteSeleccionadoId: null,
      mensaje: '',
    }),
}));
