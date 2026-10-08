import { type ButtonHTMLAttributes } from 'react';

export function Boton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`boton-campo px-5 py-2.5 font-semibold rounded-sm bg-[#1b5e20] text-white hover:bg-[#124116] active:scale-95 transition-all disabled:opacity-50 ${className}`} />;
}

export function BotonSecundario({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`boton-campo px-5 py-2.5 font-semibold rounded-sm bg-white text-[#1b5e20] border-2 border-[#1b5e20] hover:bg-green-50 active:scale-95 transition-all ${className}`} />;
}

export function BotonSol({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`boton-campo px-5 py-2.5 font-semibold rounded-sm bg-[#141414] text-white hover:bg-black active:scale-95 transition-all ${className}`} />;
}
