import { useQuery } from '@tanstack/react-query';
import { GraficoSuelo } from './GraficoSuelo';
import { PuntajeSalud } from './PuntajeSalud';
import { TarjetaDiagnostico } from './TarjetaDiagnostico';
import { puntajeLocal } from '../servicios/diagnostico';
import { usoPredio } from '../estado/usoPredio';
import type { Diagnostico } from '../esquemas/diagnostico';

const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

// Envoltorio lazy: solo se descarga Recharts cuando se visita diagnóstico.
export default function GraficoDiagnosticoPesado({ predioIdentificador }: { predioIdentificador: string }) {
  const { fechaCache } = usoPredio();
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
        })),
        puntajeSalud: c.puntaje_salud ? {
          puntaje: c.puntaje_salud.puntaje, nivel: c.puntaje_salud.nivel, detalle: c.puntaje_salud.detalle,
          n_optimo: c.puntaje_salud.n_optimo, n_total: c.puntaje_salud.n_total, fuente: c.puntaje_salud.fuente,
        } : undefined,
      } as Diagnostico;
    }
  });
  if (!data) return <p className="text-sm">Gráfico disponible con conexión o tras sembrar demo (offline usa tarjetas).</p>;
  const puntaje = data.puntajeSalud ?? puntajeLocal(data.hallazgos);
  return (
    <div className="grid gap-4">
      <PuntajeSalud puntaje={puntaje} fechaCache={fechaCache ?? undefined} />
      <GraficoSuelo hallazgos={data.hallazgos} oscuro />
      <div className="grid gap-2">
        {data.hallazgos.map((h) => <TarjetaDiagnostico key={h.parametro} hallazgo={h} />)}
      </div>
    </div>
  );
}
