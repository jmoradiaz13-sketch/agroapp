import { type ButtonHTMLAttributes, type ReactNode } from 'react';

// Botón píldora estilo Monolog: etiqueta + lateral con flecha deslizante.
// Sobrio y profesional; respeta claro/oscuro por variables.
function Estructura({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="btn-mono-etiqueta grow">{children}</span>
      <span className="btn-mono-lateral" aria-hidden>
        <span className="btn-mono-flecha">→</span>
      </span>
    </>
  );
}

export function Boton({ className = '', children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} {...props} className={`boton-campo btn-mono btn-mono-primario group disabled:opacity-50 ${className}`}>
      <Estructura>{children}</Estructura>
    </button>
  );
}

export function BotonSecundario({ className = '', children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} {...props} className={`boton-campo btn-mono btn-mono-secundario group ${className}`}>
      <Estructura>{children}</Estructura>
    </button>
  );
}

export function BotonSol({ className = '', children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} {...props} className={`boton-campo btn-mono btn-mono-acento group ${className}`}>
      <Estructura>{children}</Estructura>
    </button>
  );
}
