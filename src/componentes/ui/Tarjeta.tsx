import type { ReactNode } from 'react';

export function Tarjeta({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-neutral-200 rounded-sm p-4 grid gap-3 bg-white shadow-sm ${className}`}>
      <h2 className="text-lg font-semibold text-[#141414] flex items-center gap-2">
        <span className="inline-block w-1 h-6 bg-[#1b5e20]" aria-hidden />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Insignia({ texto }: { texto: string }) {
  return <span className="text-xs font-medium border border-neutral-200 rounded-full px-3 py-1 bg-green-50 text-[#1b5e20]">{texto}</span>;
}
