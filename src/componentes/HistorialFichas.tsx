import { useQuery } from '@tanstack/react-query';
import { TarjetaDiagnostico } from './TarjetaDiagnostico';
import type { Diagnostico } from '../esquemas/diagnostico';

const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

// Carga progresiva: primero historial liviano, detalle bajo demanda (No Saturar).
export function HistorialFichas({ predioIdentificador }: { predioIdentificador: string }) {
  const historial = useQuery({
    queryKey: ['historial', predioIdentificador],
    queryFn: async () => {
      const r = await fetch(`${URL_API}/diagnostico/${predioIdentificador}/historial`);
      if (!r.ok) throw new Error('Sin conexión o sin historial (offline: usa caché local)');
      return (await r.json()) as { version: number; fecha: string; referencia: string }[];
    },
    retry: 1
  });

  const diagnostico = useQuery({
    queryKey: ['diagnostico', predioIdentificador],
    queryFn: async () => {
      const r = await fetch(`${URL_API}/diagnostico/${predioIdentificador}/ultimo`);
      if (!r.ok) throw new Error('Sin diagnóstico');
      const crudo = await r.json();
      const adaptado: Diagnostico = {
        predioIdentificador: crudo.predio_identificador,
        fichaVersion: crudo.ficha_version,
        hallazgos: (crudo.hallazgos ?? []).map((h: Record<string, unknown>) => ({
          parametro: h['parametro'],
          unidad: h['unidad'],
          valor: h['valor'],
          estado: h['estado'],
          porque: h['porque'],
          referenciaBibliografica: h['referencia_bibliografica']
        }))
      };
      return adaptado;
    },
    retry: 1
  });

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold text-[#141414] border-b-2 border-[#1b5e20] pb-2">
        Diagnóstico y serie temporal (inmutable)
      </h2>
      {historial.isError && <p className="mensaje-info">Offline o sin historial remoto — las fichas locales siguen en Dexie.</p>}
      {historial.data && (
        <ol className="bg-white border border-neutral-200 divide-y divide-neutral-100">
          {historial.data.map((f) => (
            <li key={f.version} className="px-4 py-2.5 text-sm grid sm:grid-cols-[auto_1fr] gap-1 sm:gap-3">
              <span className="font-semibold text-[#1b5e20]">v{f.version}</span>
              <span className="text-neutral-600">{f.fecha} — {f.referencia}</span>
            </li>
          ))}
        </ol>
      )}
      {diagnostico.data?.hallazgos.map((h) => (
        <TarjetaDiagnostico key={h.parametro} hallazgo={h} />
      ))}
    </section>
  );
}
