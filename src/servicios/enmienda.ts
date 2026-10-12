const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

export interface EnmiendaCal {
  dosis_t_ha: number;
  clase: string;
  manejo: string;
  aplicaciones: number;
  dosis_por_aplicacion_t_ha: number;
  saturacion_al_pct: number;
  fuente: string;
}

// Dosis de cal validada: el servidor fracciona sobre 2,5 t/ha.
export async function pedirCal(
  predio: string,
  aluminio: number,
  cice: number,
  textura: string,
): Promise<{ ok: boolean; enmienda?: EnmiendaCal; error?: string }> {
  try {
    const url = new URL(`${URL_API}/analisis/enmienda-cal`);
    url.searchParams.set('predio_identificador', predio);
    url.searchParams.set('aluminio_cmol_kg', String(aluminio));
    url.searchParams.set('cice_cmol_kg', String(cice));
    url.searchParams.set('textura', textura);
    const r = await fetch(url.toString());
    if (!r.ok) {
      const detalle = await r.json().catch(() => ({}));
      return { ok: false, error: (detalle as { detail?: string }).detail ?? `Error ${r.status}` };
    }
    return { ok: true, enmienda: (await r.json()) as EnmiendaCal };
  } catch {
    return { ok: false, error: 'Sin conexión: calcula la enmienda en oficina.' };
  }
}

// Textura al tacto (ficha) -> enum del endpoint de cal.
export function texturaACal(tacto: string | undefined): string {
  const t = (tacto ?? '').toLowerCase();
  if (t.includes('arenoso') || t.includes('arena')) return 'arenoso';
  if (t.includes('arcilla')) return 'arcilloso';
  if (t.includes('limoso')) return 'limoso';
  return 'franco';
}
