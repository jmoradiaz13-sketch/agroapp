import { useState } from 'react';

// Precisión GPS visible (QField/Mergin): verde ≤10 m, ámbar ≤30 m, rojo más.
// El técnico decide si el punto sirve para el lote o la muestra.
export function colorPrecision(metros: number | null): string {
  if (metros === null) return '#94a3b8';
  if (metros <= 10) return '#14736E';
  if (metros <= 30) return '#f59e0b';
  return '#dc2626';
}

export function textoPrecision(metros: number | null): string {
  if (metros === null) return 'GPS sin lectura';
  if (metros <= 10) return `GPS ±${Math.round(metros)} m · buena precisión`;
  if (metros <= 30) return `GPS ±${Math.round(metros)} m · precisión media`;
  return `GPS ±${Math.round(metros)} m · poca precisión: acércate al punto`;
}

export function usarGps() {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [precision, setPrecision] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const ubicar = (alFijar?: (lat: number, lng: number, precisionM: number) => void) => {
    if (!navigator.geolocation) {
      setMensaje('GPS no disponible en este dispositivo.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        const acc = p.coords.accuracy ?? 999;
        setPos([lat, lng]);
        setPrecision(acc);
        setMensaje(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} · ${textoPrecision(acc)}`);
        alFijar?.(lat, lng, acc);
      },
      () => setMensaje('Sin señal GPS. Mueve el mapa manualmente.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return { pos, precision, mensaje, ubicar };
}
