import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { baseDatos } from '../base_datos/local';
import { TabsSuelos } from '../componentes/suelo/TabsSuelos';
import { AMBITO_SUELOS } from '../datos/variables_suelo';
import { Boton } from '../componentes/ui/Boton';

interface FilaHistorial { id?: number; fecha?: string; tipoEvaluacion?: string; version?: number }

// Historial de fichas inmutables (nueva versión por fecha, AGENTS.md §2.1).
// Qué se registró, cuándo y qué falta.
export function HistorialSuelos() {
  const [filas, setFilas] = useState<FilaHistorial[]>([]);
  const [mensaje, setMensaje] = useState('Cargando historial local…');

  useEffect(() => {
    baseDatos.fichasSuelo.where('predioIdentificador').equals(AMBITO_SUELOS).toArray()
      .then((r) => {
        setFilas((r as FilaHistorial[]).sort((a, b) => (b.version ?? 0) - (a.version ?? 0)));
        setMensaje(r.length === 0 ? 'Sin fichas locales todavía. Registra la primera.' : '');
      })
      .catch(() => setMensaje('No se pudo leer el caché local.'));
  }, []);

  return (
    <div className="grid gap-4 animacion-entrada">
      <TabsSuelos />
      <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: '62ch' }}>
        Versiones inmutables de la caracterización. Cada guardado crea una nueva versión con fecha.
      </p>
      {mensaje && <p className="mensaje-info">{mensaje}</p>}
      {filas.length > 0 && (
        <ol className="grid gap-2">
          {filas.map((f) => (
            <li key={f.version ?? f.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 border" style={{ background: 'var(--sup)', borderColor: 'var(--borde)' }}>
              <span className="font-semibold" style={{ color: 'var(--acento)' }}>v{f.version}</span>
              <span className="text-sm">{f.fecha ?? '—'}</span>
              <span className="text-xs opacity-70">{f.tipoEvaluacion ?? 'mixta'}</span>
              <Link to="/diagnostico" className="ml-auto text-xs font-semibold underline underline-offset-4">Ver en diagnóstico →</Link>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap gap-2">
        <Link to="/ficha"><Boton>Registrar nueva ficha</Boton></Link>
        <Link to="/diagnostico"><Boton>Ir a diagnosticar</Boton></Link>
      </div>
    </div>
  );
}
