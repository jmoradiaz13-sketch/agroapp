// Variante árbol: monograma "A + hoja" donde la A es el tronco
// (dos trazos que suben al ápice) y tres hojas forman la copa.
export function LogoArbolA({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true" focusable="false">
      {/* Copa: tres hojas */}
      <path
        d="M24 20C20.5 15.5 20.5 10 24 6 27.5 10 27.5 15.5 24 20Z"
        fill="currentColor"
      />
      <path
        d="M22.5 20.5C18 19.5 15 16.5 14 11.5 18.8 12.5 21.8 15.5 22.5 20.5Z"
        fill="currentColor"
      />
      <path
        d="M25.5 20.5C30 19.5 33 16.5 34 11.5 29.2 12.5 26.2 15.5 25.5 20.5Z"
        fill="currentColor"
        opacity="0.65"
      />
      {/* Tronco en forma de A */}
      <path
        d="M17 41 24 20"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M31 41 24 20"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Línea de suelo */}
      <path
        d="M10 41.5H38"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
// Inspirado en marcas agro reales (Agrinet, Sprout, Agrico): símbolo sólido,
// monolinea redondeada, sin degradados, legible en mono y a 32 px.
// Se dibuja en currentColor: hereda el color del contenedor.
// Logotipo AgroForestapp: brote minimalista geométrico (tallo + dos hojas + línea de suelo).
export function LogoAgroApp({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true" focusable="false">
      {/* Hojas del brote */}
      <path
        d="M24 27C17.5 27 13 22.8 11.8 15.5 19 16.7 23.2 20.6 24 27Z"
        fill="currentColor"
      />
      <path
        d="M24 23.5C29.4 23.5 33 20.2 34 14.5 28.6 15.5 24.7 18.4 24 23.5Z"
        fill="currentColor"
        opacity="0.65"
      />
      {/* Tallo */}
      <path
        d="M24 27V37"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Línea de suelo */}
      <path
        d="M10 41.5H38"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
