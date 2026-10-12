import { type ButtonHTMLAttributes } from 'react';

export function Boton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`boton-campo px-5 py-2.5 font-semibold rounded-sm bg-selva text-white hover:bg-selva-oscuro active:scale-95 transition-all disabled:opacity-50 ${className}`} />;
}

export function BotonSecundario({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`boton-campo px-5 py-2.5 font-semibold rounded-sm bg-white text-emerald-700 border-2 border-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all ${className}`} />;
}

export function BotonSol({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`boton-campo px-5 py-2.5 font-semibold rounded-sm bg-selva text-white hover:bg-selva-profundo active:scale-95 transition-all ${className}`} />;
}
