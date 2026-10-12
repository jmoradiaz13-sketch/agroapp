import type { ReactNode } from 'react';

export function Tarjeta({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl p-4 sm:p-5 grid gap-3 ${className}`} style={{ border: '1px solid var(--borde)', background: 'var(--sup)', boxShadow: 'var(--sombra-suave)' }}>
      <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--texto)' }}>
        <span className="inline-block w-1 h-6 rounded-full" style={{ background: 'var(--acento)' }} aria-hidden />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Insignia({ texto }: { texto: string }) {
  return <span className="text-xs font-medium rounded-full px-3 py-1" style={{ border: '1px solid var(--borde)', background: 'var(--acento-suave)', color: 'var(--texto)' }}>{texto}</span>;
}
