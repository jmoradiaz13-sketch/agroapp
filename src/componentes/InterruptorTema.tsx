import { useEffect, useState } from 'react';

const CLAVE = 'agroapp_tema';

export function aplicarTema(oscuro: boolean) {
  aplicar(oscuro);
}

/** Compatibilidad: antes se guardaba `claro: boolean`. Ahora `oscuro: boolean`. */
export function leerTemaClaro(): boolean {
  return !leerTemaOscuro();
}

export function leerTemaOscuro(): boolean {
  try {
    return localStorage.getItem(CLAVE) === 'oscuro';
  } catch {
    return false;
  }
}

function aplicar(oscuro: boolean) {
  document.documentElement.classList.toggle('tema-oscuro', oscuro);
  try {
    localStorage.setItem(CLAVE, oscuro ? 'oscuro' : 'claro');
  } catch {
    // almacenamiento bloqueado: el tema vive solo en memoria
  }
}

// Interruptor claro/oscuro tierra (claro por defecto). Dos instancias
// (sidebar + header móvil) se sincronizan por evento.
export function InterruptorTema({ etiqueta = 'Cambiar tema claro/oscuro', invertido = false }: { etiqueta?: string; invertido?: boolean }) {
  const [oscuro, setOscuro] = useState(leerTemaOscuro);

  useEffect(() => {
    aplicar(oscuro);
  }, [oscuro]);

  useEffect(() => {
    const alCambiar = (e: Event) => setOscuro((e as CustomEvent<boolean>).detail);
    window.addEventListener('agroapp:tema', alCambiar);
    return () => window.removeEventListener('agroapp:tema', alCambiar);
  }, []);

  const alternar = () => {
    const siguiente = !oscuro;
    setOscuro(siguiente);
    window.dispatchEvent(new CustomEvent<boolean>('agroapp:tema', { detail: siguiente }));
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={etiqueta}
      aria-pressed={oscuro}
      title={etiqueta}
      className={`boton-campo w-10 h-10 grid place-items-center transition-all shrink-0 ${invertido ? 'interruptor-invertido' : 'interruptor'}`}
      style={{ color: invertido ? 'var(--marca-texto)' : 'var(--texto)' }}
    >
      <span aria-hidden>
        {oscuro ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="w-5 h-5">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z" />
          </svg>
        )}
      </span>
    </button>
  );
}
