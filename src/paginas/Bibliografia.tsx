import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';

const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

interface Referencia {
  id: number;
  titulo: string;
  fuente: string;
}

// Consulta bibliografía embebida: online intenta servidor, offline muestra mensaje + caché local.
export function PaginaBibliografia() {
  const [filtro, setFiltro] = useState('');
  const consulta = useQuery({
    queryKey: ['referencias'],
    queryFn: async () => {
      const r = await fetch(`${URL_API}/referencias`);
      if (!r.ok) throw new Error('offline');
      return (await r.json()) as Referencia[];
    },
    retry: 1
  });

  const refs = (consulta.data ?? []).filter((r) =>
    `${r.titulo} ${r.fuente}`.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Trazabilidad científica"
        titulo="Biblioteca"
        descripcion="Cada recomendación se traza a estas referencias (src/). Requiere conexión para actualizar; offline usa la caché local."
      />
      <div className="bg-white border border-neutral-200 p-3">
        <label className="etiqueta-campo">Filtrar referencias
          <input
            className="campo-entrada"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Ej: cacao, VSA, suelo…"
          />
        </label>
      </div>
      {consulta.isError && (
        <p className="mensaje-info">
          Sin conexión: consulta los JSONs en agroappbknd/datos_bibliograficos/references.json (16 refs).
        </p>
      )}
      {consulta.isPending && <p className="mensaje-info">Cargando referencias…</p>}
      <div className="grid gap-2">
        {refs.map((r, i) => (
          <article key={r.id} className="bg-white border border-neutral-200 border-l-4 border-l-[#1b5e20] p-4 grid gap-1">
            <p className="text-[11px] font-medium tracking-wide text-neutral-400">Ref {String(i + 1).padStart(2, '0')}</p>
            <h3 className="font-medium text-[#141414]">{r.titulo}</h3>
            <p className="text-sm text-neutral-500">{r.fuente}</p>
          </article>
        ))}
        {consulta.data && refs.length === 0 && (
          <p className="text-sm text-neutral-500">Sin resultados para ese filtro.</p>
        )}
      </div>
    </div>
  );
}
