import { baseDatos } from '../base_datos/local';

const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

// Cola offline: fichas con sincronizada=false se envían cuando hay red.
// Respeta inmutabilidad: siempre POST nueva versión, nunca PUT.
// Adjunta JWT usuario único si existe (visible en Ingreso).
export async function sincronizarPendientes(): Promise<{ enviadas: number; errores: number }> {
  if (!navigator.onLine) return { enviadas: 0, errores: 0 };
  const token = localStorage.getItem('agroapp_token');
  const cabeceras: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) cabeceras['Authorization'] = `Bearer ${token}`;
  const pendientes = await baseDatos.fichasSuelo.filter((f) => !f.sincronizada).toArray();
  let enviadas = 0;
  let errores = 0;
  for (const ficha of pendientes) {
    try {
      const respuesta = await fetch(`${URL_API}/fichas-suelo/nueva-version`, {
        method: 'POST',
        headers: cabeceras,
        body: JSON.stringify({
          predio_identificador: ficha.predioIdentificador,
          fecha: ficha.fecha,
          calcio_cmol_kg: ficha.calcioCmolKg,
          magnesio_cmol_kg: ficha.magnesioCmolKg,
          potasio_cmol_kg: ficha.potasioCmolKg,
          fosforo_mg_kg: ficha.fosforoMgKg,
          materia_organica_pct: ficha.materiaOrganicaPct,
          nitrogeno_pct: ficha.nitrogenoPct,
          conductividad_ds_m: ficha.conductividadDsM,
          referencia_bibliografica: ficha.referenciaBibliografica
        })
      });
      if (respuesta.ok && ficha.id) {
        await baseDatos.fichasSuelo.update(ficha.id, { sincronizada: true });
        enviadas += 1;
      } else {
        errores += 1;
      }
    } catch {
      errores += 1;
    }
  }
  const fotos = await sincronizarFotos(token);
  enviadas += fotos.enviadas;
  errores += fotos.errores;
  return { enviadas, errores };
}

// Cola de fotos: multipart por archivo, atadas a predio+versión en servidor.
export async function sincronizarFotos(token: string | null): Promise<{ enviadas: number; errores: number }> {
  if (!navigator.onLine) return { enviadas: 0, errores: 0 };
  const pendientes = await baseDatos.fotos.filter((f) => !f.sincronizada).toArray();
  let enviadas = 0;
  let errores = 0;
  for (const foto of pendientes) {
    try {
      const ficha = foto.fichaId ? await baseDatos.fichasSuelo.get(foto.fichaId) : undefined;
      const forma = new FormData();
      forma.append('archivo', foto.foto, `foto-${foto.id ?? 'tmp'}.jpg`);
      forma.append('predio_identificador', foto.predioIdentificador);
      if (ficha) forma.append('ficha_version', String(ficha.version));
      if (foto.loteNombre) forma.append('lote_nombre', foto.loteNombre);
      forma.append('tipo', foto.tipo);
      if (foto.lat !== undefined) forma.append('lat', String(foto.lat));
      if (foto.lng !== undefined) forma.append('lng', String(foto.lng));
      if (foto.coberturaPct !== undefined) forma.append('cobertura_pct', String(foto.coberturaPct));
      forma.append('fecha', foto.fecha);
      const cabeceras: Record<string, string> = {};
      if (token) cabeceras['Authorization'] = `Bearer ${token}`;
      const respuesta = await fetch(`${URL_API}/fotos`, { method: 'POST', headers: cabeceras, body: forma });
      if (respuesta.ok && foto.id) {
        await baseDatos.fotos.update(foto.id, { sincronizada: true });
        enviadas += 1;
      } else {
        errores += 1;
      }
    } catch {
      errores += 1;
    }
  }
  return { enviadas, errores };
}

export function iniciarSincronizacionAutomatica(intervaloMs = 30000): () => void {
  const id = window.setInterval(() => void sincronizarPendientes(), intervaloMs);
  window.addEventListener('online', () => void sincronizarPendientes());
  return () => window.clearInterval(id);
}
