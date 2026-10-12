import { useState } from 'react';
import { Boton } from './ui/Boton';

const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

// MVP 9: informe propietario lenguaje no técnico (usa /informes, fallback offline).
export function BotonInforme({ predioIdentificador }: { predioIdentificador: string }) {
  const [mensaje, setMensaje] = useState('');

  const descargar = async () => {
    try {
      const r = await fetch(`${URL_API}/informes/${predioIdentificador}/pdf`);
      if (!r.ok) throw new Error('sin backend');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-${predioIdentificador}.pdf`;
      a.click();
      setMensaje('Informe descargado.');
    } catch {
      setMensaje('Sin backend: genera el informe con Python (ver LEEME) o usa los datos locales. Lenguaje propietario: suelo sano = buena cobertura y lombrices.');
    }
  };

  return (
    <section className="bg-selva text-white p-5 grid gap-3">
      <h2 className="text-lg font-semibold">Informe para el propietario</h2>
      <p className="text-xs text-white/60">PDF en lenguaje claro, listo para entregar en campo u oficina.</p>
      <div><Boton onClick={() => void descargar()}>Descargar PDF (lenguaje claro)</Boton></div>
      {mensaje && <p className="text-xs bg-white/10 border border-white/20 p-2.5">{mensaje}</p>}
    </section>
  );
}
