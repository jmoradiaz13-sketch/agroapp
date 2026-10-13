import { useState } from 'react';

// Tarjeta educativa colapsable "Aprende en campo": por qué importa + cómo actuar.
export function AyudaCampo({ titulo, porque, como, fuente }: { titulo: string; porque: string; como: string; fuente: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="rounded-2xl p-3" style={{ border: '1px solid var(--borde)', background: 'var(--acento-suave)' }}>
      <button
        className="boton-campo w-full flex items-center justify-between gap-2 text-left text-sm font-semibold"
        style={{ color: 'var(--texto)' }}
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <span>{titulo}</span>
        <span aria-hidden style={{ color: 'var(--acento)' }}>{abierto ? '▲' : '▼'}</span>
      </button>
      {abierto && (
        <div className="mt-2 grid gap-1.5 text-sm animacion-entrada" style={{ color: 'var(--muted)' }}>
          <p><strong style={{ color: 'var(--texto)' }}>Por qué importa:</strong> {porque}</p>
          <p><strong style={{ color: 'var(--texto)' }}>Qué hacer:</strong> {como}</p>
          <p className="text-[11px] italic" style={{ color: 'var(--faint)' }}>Fuente: {fuente}</p>
        </div>
      )}
    </div>
  );
}
