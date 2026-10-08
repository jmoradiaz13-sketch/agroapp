import { create } from 'zustand';

interface EstadoSesion {
  token: string | null;
  fijarToken: (t: string) => void;
  salir: () => void;
}

export const usoSesion = create<EstadoSesion>((fijar) => ({
  token: localStorage.getItem('agroapp_token'),
  fijarToken: (t) => { localStorage.setItem('agroapp_token', t); fijar({ token: t }); },
  salir: () => { localStorage.removeItem('agroapp_token'); fijar({ token: null }); }
}));

export async function ingresar(usuario: string, clave: string): Promise<boolean> {
  const URL_API = import.meta.env.VITE_URL_API ?? 'http://localhost:8000';
  const cuerpo = new URLSearchParams({ username: usuario, password: clave });
  const r = await fetch(`${URL_API}/auth/ingresar`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: cuerpo
  });
  if (!r.ok) return false;
  const j = await r.json();
  usoSesion.getState().fijarToken(j.token_acceso);
  return true;
}
