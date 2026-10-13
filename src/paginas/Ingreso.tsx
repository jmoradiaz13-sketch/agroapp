import { useState } from 'react';
import { ingresar, usoSesion } from '../estado/usoSesion';
import { Boton, BotonSecundario } from '../componentes/ui/Boton';
import { LogoMarca } from '../componentes/ui/Logo';

export function PaginaIngreso() {
  const [usuario, setUsuario] = useState('tecnico');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { token, salir } = usoSesion();

  if (token) {
    return (
      <div className="grid gap-6 justify-items-center py-10 animacion-entrada">
        <span className="w-24 h-16 grid place-items-center overflow-hidden" aria-hidden>
          <LogoMarca className="w-24 h-16" />
        </span>
        <div className="text-center grid gap-1">
          <h2 className="font-display text-3xl font-medium text-humus">Sesión activa</h2>
          <p className="text-sm text-neutral-500">Sesión técnica activa (JWT usuario único).</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-sm p-6 grid gap-3 w-full max-w-sm shadow-sm">
          <p className="mensaje-ok">Puedes seguir trabajando en campo y sincronizar en oficina.</p>
          <BotonSecundario onClick={salir}>Cerrar sesión</BotonSecundario>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 justify-items-center py-10 animacion-entrada">
      <span className="w-24 h-16 grid place-items-center overflow-hidden" aria-hidden>
        <LogoMarca className="w-24 h-16" />
      </span>
      <div className="text-center grid gap-1">
        <h2 className="font-display text-3xl font-medium text-humus">Bienvenido de nuevo</h2>
        <p className="text-sm text-neutral-500">Ingresa para sincronizar tus datos con el servidor.</p>
      </div>

      <form
        className="bg-white border border-neutral-200 rounded-sm w-full max-w-sm overflow-hidden shadow-[0_12px_40px_-16px_rgba(20,65,22,0.35)]"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setCargando(true);
          try {
            if (!(await ingresar(usuario, clave))) setError('Credenciales inválidas. Verifica usuario y clave.');
          } finally {
            setCargando(false);
          }
        }}
      >
        <div className="h-1 bg-[#059669]" aria-hidden />
        <div className="p-6 sm:p-8 grid gap-5">
          <label className="etiqueta-campo">Usuario
            <input
              className="campo-entrada"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              placeholder="Nombre de usuario"
            />
          </label>
          <label className="etiqueta-campo">Clave
            <input
              className="campo-entrada"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          {error && <p className="mensaje-error" role="alert">{error}</p>}
          <Boton type="submit" disabled={cargando} className="w-full !py-3">
            {cargando ? 'Verificando…' : 'Ingresar'}
          </Boton>
          <p className="text-[11px] text-center text-neutral-400">
            Autenticación JWT de usuario único · Funciona offline con tu sesión guardada
          </p>
        </div>
      </form>
    </div>
  );
}
