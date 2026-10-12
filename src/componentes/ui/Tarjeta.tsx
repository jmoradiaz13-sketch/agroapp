import type { ReactNode } from 'react';

export function Tarjeta({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`border border-neutral-200 rounded-2xl p-4 sm:p-5 grid gap-3 bg-white shadow-sm ${className}`}>
      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <span className="inline-block w-1 h-6 bg-emerald-500" aria-hidden />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Insignia({ texto }: { texto: string }) {
  return <span className="text-xs font-medium border border-emerald-200 rounded-full px-3 py-1 bg-emerald-50 text-emerald-700">{texto}</span>;
}
