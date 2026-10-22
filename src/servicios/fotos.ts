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
  canvas.getContext('2d', { willReadFrequently: true })!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
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

export interface AnalisisCobertura {
  pct: number;
  mascara: string;
  verdes: number;
  total: number;
}

function esVerde(r: number, g: number, b: number): boolean {
  return g > r + 10 && g > b + 10;
}

// Devuelve el porcentaje y una máscara PNG (fondo transparente, píxeles
// verdes resaltados) para mostrar la evidencia sin salir del dispositivo.
export async function analizarCobertura(foto: Blob, maxLado = 800): Promise<AnalisisCobertura> {
  const bitmap = await aBitmap(foto);
  const canvas = aCanvas(bitmap, maxLado);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const datos = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const total = canvas.width * canvas.height;

  const mascara = document.createElement('canvas');
  mascara.width = canvas.width;
  mascara.height = canvas.height;
  const ctxMascara = mascara.getContext('2d')!;
  const pixeles = ctxMascara.createImageData(canvas.width, canvas.height);

  let verdes = 0;
  for (let i = 0; i < datos.length; i += 4) {
    if (!esVerde(datos[i], datos[i + 1], datos[i + 2])) continue;
    verdes += 1;
    pixeles.data[i] = 20;
    pixeles.data[i + 1] = 115;
    pixeles.data[i + 2] = 110;
    pixeles.data[i + 3] = 255;
  }
  ctxMascara.putImageData(pixeles, 0, 0);
  bitmap.close();

  return {
    pct: Math.round((verdes / total) * 1000) / 10,
    mascara: mascara.toDataURL('image/png'),
    verdes,
    total,
  };
}

export async function coberturaVerde(foto: Blob, maxLado = 800): Promise<number> {
  const analisis = await analizarCobertura(foto, maxLado);
  return analisis.pct;
}

export function blobAUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
