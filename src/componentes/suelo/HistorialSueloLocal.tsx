import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { baseDatos, type FichaSueloLocal } from '../../base_datos/local';
import { Tarjeta } from '../ui/Tarjeta';

// Serie local inmutable por predio y, si se elige, por lote.
export function HistorialSueloLocal({ predioIdentificador, loteNombre, versionActiva }: { predioIdentificador: string; loteNombre?: string | null; versionActiva?: number }) {
  const [filas, setFilas] = useState<FichaSueloLocal[]>([]);
  const [mensaje, setMensaje] = useState('Cargando historial local…');

  useEffect(() => {
    let vigente = true;
    setMensaje('Cargando historial local…');
    void baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).toArray()
      .then((r) => {
        if (!vigente) return;
        const visibles = r.filter((f) => !loteNombre || f.loteNombre === loteNombre);
        setFilas(visibles.sort((a, b) => b.version - a.version));
        setMensaje(visibles.length === 0 ? 'Sin fichas locales para este contexto. Registra la primera.' : '');
      })
      .catch(() => { if (vigente) setMensaje('No se pudo leer el caché local.'); });
    return () => { vigente = false; };
  }, [predioIdentificador, loteNombre]);

  return (
    <Tarjeta titulo="Historial local (inmutable)">
      <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: '62ch' }}>
        Cada guardado crea una versión con su fecha. El historial no se sobrescribe.
      </p>
      {mensaje && <p className="mensaje-info">{mensaje}</p>}
      {filas.length > 0 && (
        <ol className="grid gap-2">
          {filas.map((f) => {
            const activa = versionActiva === f.version;
            return (
              <li key={f.id ?? `${f.version}-${f.fecha}`}>
                <Link
                  to={`/suelos?vista=lectura&version=${f.version}`}
                  aria-current={activa ? 'true' : undefined}
                  className="flex flex-wrap items-center gap-2 px-4 py-2.5 border transition-colors"
                  style={{
                    background: activa ? 'var(--acento-suave)' : 'var(--sup-2)',
                    borderColor: activa ? 'var(--acento)' : 'var(--borde)',
                  }}
                >
                  <span className="font-semibold" style={{ color: 'var(--acento)' }}>v{f.version}</span>
                  <span className="text-sm">{f.fecha}</span>
                  <span className="text-xs opacity-70">{f.loteNombre ?? 'Todo el predio'}</span>
                  <span className="text-xs opacity-70">{f.tipoEvaluacion ?? 'mixta'}</span>
                  {!f.sincronizada && <span className="ml-auto text-[11px] font-semibold" style={{ color: 'var(--tierra)' }}>Pendiente sync</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Tarjeta>
  );
}
