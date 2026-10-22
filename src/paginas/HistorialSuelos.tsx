import { Navigate } from 'react-router-dom';

// Ruta legada: el historial local y remoto se lee dentro de /suelos.
export function HistorialSuelos() {
  return <Navigate to="/suelos?vista=lectura" replace />;
}
