import { useEffect, useState } from 'react';

const CLAVE = 'agroapp_tema';

export function aplicarTema(claro: boolean) {
  aplicar(claro);
}

function aplicar(claro: boolean) {  document.documentElement.classList.toggle('tema-claro', claro);
  try {
    localStorage.setItem(CLAVE, claro ? 'claro' : 'oscuro');
  } catch {
    // almacenamiento bloqueado: el tema vive solo en memoria
  }
}

export function leerTemaClaro(): boolean {
  try {
    return localStorage.getItem(CLAVE) === 'claro';
  } catch {
    return false;
  }
}

// Pequeño interruptor claro/oscuro (oscuro por defecto). Dos instancias
// (sidebar + header móvil) se sincronizan por evento.
export function InterruptorTema({ etiqueta = 'Cambiar tema claro/oscuro' }: { etiqueta?: string }) {
  const [claro, setClaro] = useState(leerTemaClaro);

  useEffect(() => {
    aplicar(claro);
  }, [claro]);

  useEffect(() => {
    const alCambiar = (e: Event) => setClaro((e as CustomEvent<boolean>).detail);
    window.addEventListener('agroapp:tema', alCambiar);
    return () => window.removeEventListener('agroapp:tema', alCambiar);
  }, []);

  const alternar = () => {
    const siguiente = !claro;
    setClaro(siguiente);
    window.dispatchEvent(new CustomEvent<boolean>('agroapp:tema', { detail: siguiente }));
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={etiqueta}
      aria-pressed={claro}
      title={etiqueta}
      className="boton-campo w-11 h-11 grid place-items-center rounded-sm text-xl bg-white/10 text-white/80 hover:bg-white/15 hover:text-white transition-colors shrink-0"
    >
      <span aria-hidden>{claro ? '🌙' : '☀️'}</span>
    </button>
  );
}
