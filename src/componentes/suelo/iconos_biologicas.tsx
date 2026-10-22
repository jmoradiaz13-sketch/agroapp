import type { IconoBiologicoId } from '../../datos/biologicas';

// Iconos de línea para la sección biológica. Se mantienen como SVG inline
// (sin dependencias) para poder sustituirlos por un set definitivo después.
function Base({ children, className = 'h-5 w-5' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconoBiologico({ id, className }: { id: IconoBiologicoId; className?: string }) {
  switch (id) {
    case 'vida':
      return (
        <Base className={className}>
          <path d="M3.5 17.5c2.5 0 3.5-1.2 5-1.2s2.5 1.2 5 1.2 3.5-1.2 6-1.2" />
          <path d="M4 20.5h16" />
          <path d="M7.5 14c-1.6-1.8-1.2-4.6 1-5.8 2-1.1 4.2-.2 4.8 1.8.5 1.7-.6 3.4-2.2 4" />
          <path d="M8.5 10.5c1.2.6 2.4.6 3.6-.2M8.8 12.5c.8.8 1.8 1 2.8.7" />
          <path d="M15.5 12.8c2-.5 4 .4 4.5 2.2" />
        </Base>
      );
    case 'vsa':
      return (
        <Base className={className}>
          <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
          <path d="M4 12 12 16.5 20 12" />
          <path d="M4 16.5 12 21l8-4.5" />
          <circle cx="9" cy="7.2" r=".7" fill="currentColor" stroke="none" />
          <circle cx="15" cy="7.2" r=".7" fill="currentColor" stroke="none" />
          <path d="M9 14.4v1.8M12 16.1v1.8M15 14.4v1.8" />
        </Base>
      );
    case 'cobertura':
      return (
        <Base className={className}>
          <path d="M4 19.5h16" />
          <path d="M12 19.5v-6" />
          <path d="M12 13.5c-3.3 0-5.5-2.2-5.5-5.5 3.3 0 5.5 2.2 5.5 5.5Z" />
          <path d="M12 11.5c3.3 0 5.5-2.2 5.5-5.5-3.3 0-5.5 2.2-5.5 5.5Z" />
          <path d="M7.5 16.5c1.3-.9 2.8-1.3 4.5-1.3s3.2.4 4.5 1.3" />
        </Base>
      );
    case 'laboratorio':
      return (
        <Base className={className}>
          <path d="M9 3h6" />
          <path d="M10 3v5.2L5.6 17a2 2 0 0 0 1.8 3h9.2a2 2 0 0 0 1.8-3L14 8.2V3" />
          <path d="M8.2 14.5h7.6" />
          <circle cx="10.2" cy="11.8" r=".8" fill="currentColor" stroke="none" />
          <circle cx="13.8" cy="17.2" r=".8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19.5" r=".6" fill="currentColor" stroke="none" />
        </Base>
      );
    case 'cierre':
      return (
        <Base className={className}>
          <path d="M7 3h10v18H7V3Z" />
          <path d="M9.5 7h5M9.5 11h5" />
          <path d="M9.5 15.5l1.3 1.3 2.7-2.8" />
        </Base>
      );
    default:
      return (
        <Base className={className}>
          <circle cx="12" cy="12" r="8" />
        </Base>
      );
  }
}
