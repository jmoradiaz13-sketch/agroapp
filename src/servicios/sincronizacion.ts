import { baseDatos } from '../base_datos/local';

const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';

// Cola offline ordenada por dependencias: predios → propietarios → lotes →
// fichas → diseños → monitoreos → puntos → fotos. Respeta inmutabilidad:
// fichas y diseños siempre POST nueva versión, nunca PUT.
// Capas IGAC, especies y escenarios quedan locales (sin endpoint servidor).
// Adjunta JWT usuario único si existe (visible en Ingreso).
export async function sincronizarPendientes(): Promise<{ enviadas: number; errores: number }> {
  if (!navigator.onLine) return { enviadas: 0, errores: 0 };
  const token = localStorage.getItem('agroapp_token');
  const cabeceras: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) cabeceras['Authorization'] = `Bearer ${token}`;
  let enviadas = 0;
  let errores = 0;
  const suma = (r: { enviadas: number; errores: number }) => {
    enviadas += r.enviadas;
    errores += r.errores;
  };
  suma(await sincronizarPredios(cabeceras));
  suma(await sincronizarLotes(cabeceras));
  suma(await sincronizarFichas(cabeceras));
  suma(await sincronizarDisenos(cabeceras));
  suma(await sincronizarMonitoreos(cabeceras));
  suma(await sincronizarPuntos(cabeceras));
  const fotos = await sincronizarFotos(token);
  enviadas += fotos.enviadas;
  errores += fotos.errores;
  return { enviadas, errores };
}

type Cabeceras = Record<string, string>;

async function post(url: string, cabeceras: Cabeceras, cuerpo?: unknown): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Predios + su propietario (un registro mutable por predio).
async function sincronizarPredios(cabeceras: Cabeceras): Promise<{ enviadas: number; errores: number }> {
  let enviadas = 0;
  let errores = 0;
  const pendientes = await baseDatos.predios.filter((p) => (p.estadoSincronizacion ?? 'pendiente') !== 'sincronizado').toArray();
  for (const p of pendientes) {
    const url = new URL(`${URL_API}/predios`);
    url.searchParams.set('identificador', p.identificador);
    url.searchParams.set('nombre', p.nombre);
    const ok = await post(url.toString(), cabeceras, p.geometria);
    if (!ok) {
      errores += 1;
      continue;
    }
    if (p.propietario?.trim()) {
      await post(`${URL_API}/propietarios`, cabeceras, {
        predio_identificador: p.identificador,
        nombre_completo: p.propietario.trim(),
        tenencia: p.tenencia,
        vocacion: p.vocacion,
        mano_obra_familiar: p.manoObraFamiliar,
      });
    }
    if (p.id) await baseDatos.predios.update(p.id, { estadoSincronizacion: 'sincronizado' });
    enviadas += 1;
  }
  return { enviadas, errores };
}

async function sincronizarLotes(cabeceras: Cabeceras): Promise<{ enviadas: number; errores: number }> {
  let enviadas = 0;
  let errores = 0;
  const pendientes = await baseDatos.lotes.filter((l) => (l.estadoSincronizacion ?? 'pendiente') !== 'sincronizado').toArray();
  for (const l of pendientes) {
    const url = new URL(`${URL_API}/lotes`);
    url.searchParams.set('predio_identificador', l.predioIdentificador);
    url.searchParams.set('nombre', l.nombre);
    if (l.usoActual) url.searchParams.set('uso_actual', l.usoActual);
    const ok = await post(url.toString(), cabeceras, l.geometria);
    if (ok && l.id) {
      await baseDatos.lotes.update(l.id, { estadoSincronizacion: 'sincronizado' });
      enviadas += 1;
    } else {
      errores += 1;
    }
  }
  return { enviadas, errores };
}

async function sincronizarFichas(cabeceras: Cabeceras): Promise<{ enviadas: number; errores: number }> {
  const pendientes = await baseDatos.fichasSuelo.filter((f) => !f.sincronizada).toArray();
  let enviadas = 0;
  let errores = 0;
  for (const ficha of pendientes) {
    const ok = await post(`${URL_API}/fichas-suelo/nueva-version`, cabeceras, {
      predio_identificador: ficha.predioIdentificador,
      fecha: ficha.fecha,
      calcio_cmol_kg: ficha.calcioCmolKg,
      magnesio_cmol_kg: ficha.magnesioCmolKg,
      potasio_cmol_kg: ficha.potasioCmolKg,
      fosforo_mg_kg: ficha.fosforoMgKg,
      metodo_fosforo: ficha.metodoFosforo,
      densidad_real: ficha.densidadReal,
      materia_organica_pct: ficha.materiaOrganicaPct,
      nitrogeno_pct: ficha.nitrogenoPct,
      conductividad_ds_m: ficha.conductividadDsM,
      referencia_bibliografica: ficha.referenciaBibliografica
    });
    if (ok && ficha.id) {
      await baseDatos.fichasSuelo.update(ficha.id, { sincronizada: true });
      enviadas += 1;
    } else {
      errores += 1;
    }
  }
  return { enviadas, errores };
}

async function sincronizarDisenos(cabeceras: Cabeceras): Promise<{ enviadas: number; errores: number }> {
  let enviadas = 0;
  let errores = 0;
  const pendientes = await baseDatos.disenos.filter((d) => !d.sincronizada).toArray();
  for (const d of pendientes) {
    const ok = await post(`${URL_API}/disenos/nueva-version`, cabeceras, {
      predio_identificador: d.predioIdentificador === 'sin-predio' ? null : d.predioIdentificador,
      unidad_nombre: d.nombreUnidad,
      fecha: d.fecha,
      area_total_ha: d.areaTotalHa,
      zona_clima: d.zonaClima,
      objetivo: d.objetivo,
      tipo_diseno: d.tipoDiseno,
      nivel_transicion: d.nivelTransicion,
      usos_suelo: d.usosSuelo,
      componentes: d.componentes,
      rotacion_asociacion: d.rotacionAsociacion,
      referencia_bibliografica: d.referenciaBibliografica,
    });
    if (ok && d.id) {
      await baseDatos.disenos.update(d.id, { sincronizada: true });
      enviadas += 1;
    } else {
      errores += 1;
    }
  }
  return { enviadas, errores };
}

// Monitoreos: resuelve el lote servidor por nombre dentro del predio.
async function sincronizarMonitoreos(cabeceras: Cabeceras): Promise<{ enviadas: number; errores: number }> {
  let enviadas = 0;
  let errores = 0;
  const pendientes = await baseDatos.monitoreos.filter((m) => !m.sincronizada).toArray();
  const cacheLotes = new Map<string, { id: number; nombre: string }[]>();
  for (const m of pendientes) {
    try {
      const lotes = await baseDatos.lotes.where('nombre').equals(m.loteNombre).toArray();
      const loteLocal = lotes[0];
      if (!loteLocal) {
        errores += 1;
        continue;
      }
      let servidor = cacheLotes.get(loteLocal.predioIdentificador);
      if (!servidor) {
        const r = await fetch(`${URL_API}/lotes/por-predio/${encodeURIComponent(loteLocal.predioIdentificador)}`, { headers: cabeceras });
        if (!r.ok) {
          errores += 1;
          continue;
        }
        servidor = (await r.json()) as { id: number; nombre: string }[];
        cacheLotes.set(loteLocal.predioIdentificador, servidor);
      }
      const destino = servidor.find((s) => s.nombre === loteLocal.nombre);
      if (!destino) {
        errores += 1;
        continue;
      }
      const url = new URL(`${URL_API}/monitoreos`);
      url.searchParams.set('lote_id', String(destino.id));
      if (m.observaciones) url.searchParams.set('observaciones', m.observaciones);
      const ok = await post(url.toString(), cabeceras, m.indicadores);
      if (ok && m.id) {
        await baseDatos.monitoreos.update(m.id, { sincronizada: true });
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

async function sincronizarPuntos(cabeceras: Cabeceras): Promise<{ enviadas: number; errores: number }> {
  let enviadas = 0;
  let errores = 0;
  const pendientes = await baseDatos.puntosMuestreo.filter((p) => !p.sincronizada).toArray();
  for (const p of pendientes) {
    const url = new URL(`${URL_API}/puntos`);
    url.searchParams.set('predio_identificador', p.predioIdentificador);
    url.searchParams.set('codigo', p.codigo);
    url.searchParams.set('lat', String(p.lat));
    url.searchParams.set('lng', String(p.lng));
    if (p.loteNombre) url.searchParams.set('lote_nombre', p.loteNombre);
    url.searchParams.set('fecha', p.fecha);
    const ok = await post(url.toString(), cabeceras);
    if (ok && p.id) {
      await baseDatos.puntosMuestreo.update(p.id, { sincronizada: true });
      enviadas += 1;
    } else {
      errores += 1;
    }
  }
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
