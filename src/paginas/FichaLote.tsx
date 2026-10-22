import { Navigate } from 'react-router-dom';

// Ruta legada: la ficha vive dentro de la sección única /suelos.
export function FichaLote() {
  return <Navigate to="/suelos?vista=ficha" replace />;
}
