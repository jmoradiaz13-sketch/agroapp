import * as turf from '@turf/turf';

// Utilidades geográficas del cliente. Todo se calcula en WGS84 (EPSG:4326)
// y las superficies usan Turf geodésico, nunca geometría plana.

export type Coordenada = [number, number]; // [longitud, latitud]
export interface Bbox {
  oeste: number;
  sur: number;
  este: number;
  norte: number;
}

export function poligonoDesdePuntos(puntos: Coordenada[]): GeoJSON.Polygon | null {
  if (puntos.length < 3) return null;
  const anillo = [...puntos, puntos[0]];
  return { type: 'Polygon', coordinates: [anillo] };
}

export function puntosDesdePoligono(geometria: GeoJSON.Polygon): Coordenada[] {
  const anillo = geometria.coordinates[0] ?? [];
  const puntos = anillo.map(([lng, lat]) => [lng, lat] as Coordenada);
  if (puntos.length > 1) {
    const primero = puntos[0];
    const ultimo = puntos[puntos.length - 1];
    if (primero[0] === ultimo[0] && primero[1] === ultimo[1]) puntos.pop();
  }
  return puntos;
}

export function areaHaPoligono(geometria: GeoJSON.Polygon): number {
  return turf.area(turf.polygon(geometria.coordinates)) / 10000;
}

export function perimetroMPoligono(geometria: GeoJSON.Polygon): number {
  const linea = turf.polygonToLine(turf.polygon(geometria.coordinates));
  return turf.length(linea, { units: 'kilometers' }) * 1000;
}

export function bboxDeGeometrias(
  geometrias: Array<GeoJSON.Polygon | GeoJSON.Point | undefined>,
  puntos: Coordenada[] = [],
): Bbox | null {
  let oeste = Infinity;
  let sur = Infinity;
  let este = -Infinity;
  let norte = -Infinity;
  const sumar = ([lng, lat]: Coordenada) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    oeste = Math.min(oeste, lng);
    sur = Math.min(sur, lat);
    este = Math.max(este, lng);
    norte = Math.max(norte, lat);
  };
  for (const geometria of geometrias) {
    if (!geometria) continue;
    if (geometria.type === 'Point') {
      sumar(geometria.coordinates as Coordenada);
      continue;
    }
    for (const anillo of geometria.coordinates) {
      for (const coordenada of anillo) sumar(coordenada as Coordenada);
    }
  }
  for (const punto of puntos) sumar(punto);
  if (![oeste, sur, este, norte].every(Number.isFinite)) return null;
  return { oeste, sur, este, norte };
}

export function centroDeBbox(bbox: Bbox): [number, number] {
  return [(bbox.sur + bbox.norte) / 2, (bbox.oeste + bbox.este) / 2];
}

export function bboxTexto(bbox: Bbox): string {
  return `${bbox.oeste},${bbox.sur},${bbox.este},${bbox.norte}`;
}

export function bboxDePoligono(geometria: GeoJSON.Polygon): Bbox {
  const bbox = bboxDeGeometrias([geometria]);
  return bbox ?? { oeste: -74.06, sur: 4.63, este: -74.03, norte: 4.66 };
}

export function esPoligonoValido(puntos: Coordenada[]): boolean {
  return motivoPoligonoInvalido(puntos) === null;
}

export function motivoPoligonoInvalido(puntos: Coordenada[]): string | null {
  if (puntos.length < 3) return 'Agrega al menos 3 vértices para cerrar el polígono.';
  const unicos = new Set(puntos.map(([lng, lat]) => `${lng.toFixed(7)},${lat.toFixed(7)}`));
  if (unicos.size < 3) return 'Los vértices deben ser distintos.';
  const poligono = poligonoDesdePuntos(puntos);
  if (!poligono) return 'No se pudo construir el polígono.';
  if (areaHaPoligono(poligono) <= 0.0001) return 'El área es demasiado pequeña para guardarla.';
  if (!turf.booleanValid(turf.polygon(poligono.coordinates))) {
    return 'El polígono se cruza a sí mismo. Corrige los vértices antes de guardar.';
  }
  return null;
}

export function puntoEnPoligono(punto: Coordenada, geometria: GeoJSON.Polygon): boolean {
  return turf.booleanPointInPolygon(turf.point(punto), turf.polygon(geometria.coordinates));
}

export function poligonoContenido(interior: GeoJSON.Polygon, exterior: GeoJSON.Polygon): boolean {
  return turf.booleanWithin(turf.polygon(interior.coordinates), turf.polygon(exterior.coordinates));
}

export function poligonosSeSolapan(a: GeoJSON.Polygon, b: GeoJSON.Polygon, minimoM2 = 1): boolean {
  const interseccion = turf.intersect(
    turf.featureCollection([turf.polygon(a.coordinates), turf.polygon(b.coordinates)]),
  );
  if (!interseccion) return false;
  return turf.area(interseccion) >= minimoM2;
}

export function formatearCoordenada(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${ns}, ${Math.abs(lng).toFixed(5)}° ${ew}`;
}

export function formatearArea(ha: number): string {
  return `${ha.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
}

export function formatearPerimetro(metros: number): string {
  if (metros >= 1000) return `${(metros / 1000).toLocaleString('es-CO', { maximumFractionDigits: 2 })} km`;
  return `${Math.round(metros).toLocaleString('es-CO')} m`;
}
