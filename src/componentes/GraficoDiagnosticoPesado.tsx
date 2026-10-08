import { useQuery } from '@tanstack/react-query';
import { GraficoSuelo } from './GraficoSuelo';
import type { Diagnostico } from '../esquemas/diagnostico';

const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

// Envoltorio lazy: solo se descarga Recharts cuando se visita diagnóstico.
export default function GraficoDiagnosticoPesado({ predioIdentificador }: { predioIdentificador: string }) {
  const { data } = useQuery({
    queryKey: ['diagnostico-graf', predioIdentificador],
    queryFn: async () => {
      const r = await fetch(`${URL_API}/diagnostico/${predioIdentificador}/ultimo`);
      if (!r.ok) return null;
      const c = await r.json();
      return {
        predioIdentificador: c.predio_identificador, fichaVersion: c.ficha_version,
        hallazgos: (c.hallazgos ?? []).map((h: Record<string, unknown>) => ({
          parametro: h['parametro'], unidad: h['unidad'], valor: h['valor'],
          estado: h['estado'], porque: h['porque'], referenciaBibliografica: h['referencia_bibliografica']
        }))
      } as Diagnostico;
    }
  });
  if (!data) return <p className="text-sm">Gráfico disponible con conexión o tras sembrar demo (offline usa tarjetas).</p>;
  return <GraficoSuelo hallazgos={data.hallazgos} />;
}
