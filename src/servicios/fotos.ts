// Utilidades de foto offline: compresión en cliente y % cobertura verde.
// Cobertura: umbral R/G estilo Canopeo (Patrignani & Ochsner 2015,
// Agronomy Journal): píxel verde si G > R y G > B con margen.
export interface FotoLista {
  blob: Blob;
  miniatura: Blob;
  tipo: 'muestra' | 'vess' | 'cobertura' | 'punto';
  lat?: number;
  lng?: number;
  coberturaPct?: number;
}

async function aBitmap(fuente: Blob): Promise<ImageBitmap> {
  return await createImageBitmap(fuente);
}

function aCanvas(bitmap: ImageBitmap, maxLado: number): HTMLCanvasElement {
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasABlob(canvas: HTMLCanvasElement, calidad: number): Promise<Blob> {
  return new Promise((res, rej) => {
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo comprimir la foto'))), 'image/jpeg', calidad);
  });
}

export async function comprimirFoto(archivo: Blob, maxLado = 1280, calidad = 0.8): Promise<{ blob: Blob; miniatura: Blob }> {
  const bitmap = await aBitmap(archivo);
  const blob = await canvasABlob(aCanvas(bitmap, maxLado), calidad);
  const miniatura = await canvasABlob(aCanvas(bitmap, 256), 0.7);
  bitmap.close();
  return { blob, miniatura };
}

export async function coberturaVerde(foto: Blob, maxLado = 800): Promise<number> {
  const bitmap = await aBitmap(foto);
  const canvas = aCanvas(bitmap, maxLado);
  const ctx = canvas.getContext('2d')!;
  const datos = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let verdes = 0;
  const total = canvas.width * canvas.height;
  for (let i = 0; i < datos.length; i += 4) {
    const r = datos[i], g = datos[i + 1], b = datos[i + 2];
    if (g > r + 10 && g > b + 10) verdes += 1;
  }
  bitmap.close();
  return Math.round((verdes / total) * 1000) / 10;
}

export function blobAUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
