import { useState } from 'react';
import { comprimirFoto, type FotoLista } from '../servicios/fotos';

// Botón de cámara offline: comprime en cliente antes de entregar.
export function CapturaFoto({
  texto, tipo, alCapturar,
}: {
  texto: string;
  tipo: FotoLista['tipo'];
  alCapturar: (foto: FotoLista) => void;
}) {
  const [estado, setEstado] = useState('');

  const alElegir = async (archivo: File | undefined) => {
    if (!archivo) return;
    setEstado('Procesando…');
    try {
      const { blob, miniatura } = await comprimirFoto(archivo);
      alCapturar({ blob, miniatura, tipo });
      setEstado('');
    } catch {
      setEstado('No se pudo procesar la foto.');
    }
  };

  return (
    <span className="inline-grid gap-1">
      <label className="boton-campo inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm bg-white text-[#1b5e20] border border-[#1b5e20]/40 hover:border-[#1b5e20] hover:bg-green-50/60 transition-all cursor-pointer">
        📷 {texto}
        <input
          type="file" accept="image/*" capture="environment" className="hidden"
          aria-label={texto}
          onChange={(e) => void alElegir(e.target.files?.[0] ?? undefined)}
        />
      </label>
      {estado && <span className="text-xs text-neutral-500">{estado}</span>}
    </span>
  );
}
