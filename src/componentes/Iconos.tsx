// Iconos de línea minimalistas, trazo propio (uso libre, sin dependencias).
// Inspirados en bancos libres MIT/ISC (Lucide, Feather, Tabler): trazo 1.7px,
// esquinas redondas, 24x24, heredan currentColor. Temática agro: finca, suelo, SIG.
export type IconoId =
  | 'dashboard' | 'predios' | 'lotes' | 'suelos' | 'sig'
  | 'simulador' | 'diseno' | 'diagnostico' | 'informe' | 'biblioteca';

function Base({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function Icono({ id }: { id: IconoId }) {
  switch (id) {
    case 'dashboard':
      return <Base><rect x="3.5" y="3.5" width="7" height="7" /><rect x="13.5" y="3.5" width="7" height="7" /><rect x="3.5" y="13.5" width="7" height="7" /><path d="M17 13.5v7M13.5 17h7" /></Base>;
    case 'predios':
      return <Base><path d="M4 11 12 4l8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /><path d="M2.5 20.5h19" /></Base>;
    case 'lotes':
      return <Base><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" /><path d="M9 4v14M15 6v14" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></Base>;
    case 'suelos':
      return <Base><path d="M4 7.5h16M4 12h16M4 16.5h16" /><path d="M7 3.5h10" /><path d="M12 16.5V21M9.5 20 12 21.5 14.5 20" /></Base>;
    case 'sig':
      return <Base><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" /><path d="m3.5 12 8.5 4.2 8.5-4.2" /><path d="m3.5 16 8.5 4.2L20.5 16" /></Base>;
    case 'simulador':
      return <Base><path d="M9 3h6" /><path d="M10 3v5.5L5 18a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 18l-5-9.5V3" /><path d="M8 15h8" /><path d="M12 15c0 1.5-1 2-1 3.2" /></Base>;
    case 'diseno':
      return <Base><path d="M12 21v-8" /><path d="M12 13c-3.5 0-6-2.5-6-6 3.5 0 6 2 6 6Z" /><path d="M12 11c3.5 0 6-2.5 6-6-3.5 0-6 2-6 6Z" /><path d="M8 21h8" /></Base>;
    case 'diagnostico':
      return <Base><path d="M3 12h4l2.5-6 4 12L16 12h5" /></Base>;
    case 'informe':
      return <Base><path d="M7 3h7l4 4v14H7V3Z" /><path d="M14 3v4h4" /><path d="M9.5 13h5M9.5 16.5h5" /></Base>;
    case 'biblioteca':
      return <Base><path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2Z" /><path d="M12 6v14" /></Base>;
    default:
      return <Base><circle cx="12" cy="12" r="8" /></Base>;
  }
}
