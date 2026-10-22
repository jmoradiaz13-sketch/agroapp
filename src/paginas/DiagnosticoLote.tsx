import { Navigate } from 'react-router-dom';

// Ruta legada: la lectura/diagnóstico vive dentro de la sección única /suelos.
export function DiagnosticoLote() {
  return <Navigate to="/suelos?vista=lectura" replace />;
}
