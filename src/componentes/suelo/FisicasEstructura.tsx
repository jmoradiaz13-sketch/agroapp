import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import type { FotoLista } from '../../servicios/fotos';
import { NIVELES_VESS, FUENTE_VESS } from '../../datos/fisicas';
import { CapturaFoto } from '../CapturaFoto';
import { Fuente, Columna } from './fisicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

const COMPACTACION = ['suelto', 'friable', 'firme', 'compactado / hardpan'];
const INFILTRACION = ['rápida', 'moderada', 'lenta', 'encharca'];

// Slide VESS del deck de físicas: fundamentos, bloque de campo con foto
// y captura DUO (puntaje Sq1–Sq5 + compactación/infiltración).
export function FisicasEstructura({
  registro, fijar, valores, alFoto,
}: {
  registro: R; fijar: UseFormSetValue<FichaSueloFormulario>; valores: V;
  alFoto?: (f: FotoLista) => void;
}) {
  return (
    <>
      <Columna titulo="Fundamentos">
        <p className="text-sm text-neutral-600">El arreglo de agregados y poros regula agua, aire y raíces. VESS puntúa de Sq1 (friable) a Sq5 (macizo).</p>
        <img src="/imagenes/3.jpg" alt="Agregados, raíces y poros del suelo en primer plano" loading="lazy" className="w-full max-w-[220px] rounded-sm" />
        <Fuente texto={FUENTE_VESS} />
      </Columna>
      <Columna titulo="Medición">
        <p className="text-sm font-medium">Extrae un bloque de 20 cm sin pisar el borde, ábrelo como un libro y observa terrones, poros y raíces por capa. Puntúa cada capa y promedia por espesor.</p>
        {alFoto && (
          <div>
            <CapturaFoto texto="Foto del bloque VESS" tipo="vess" alCapturar={alFoto} />
            <p className="text-[11px] text-neutral-400 mt-1">Se guarda con la ficha al presionar Guardar.</p>
          </div>
        )}
      </Columna>
      <Columna titulo="Captura DUO">
        <div className="grid gap-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-3">
          {NIVELES_VESS.map((n) => (
            <button
              key={n.sq} type="button"
              onClick={() => { fijar('estructuraVess', n.sq); fijar('estructuraDesc', `VESS Sq${n.sq}`); }}
              aria-pressed={valores.estructuraVess === n.sq}
              className={`boton-campo p-3 rounded-sm border text-left transition-colors ${
                valores.estructuraVess === n.sq
                  ? 'bg-[#059669] text-white border-[#059669]'
                  : 'bg-white border-neutral-300 hover:border-[#059669]'
              }`}
            >
              <span className="block text-2xl font-semibold">Sq{n.sq}</span>
              <span className="block text-xs font-medium">{n.titulo.split('·')[1]}</span>
            </button>
          ))}
        </div>
        {valores.estructuraVess !== undefined && (
          <p className="mensaje-ok">
            {NIVELES_VESS.find((n) => n.sq === valores.estructuraVess)?.titulo}:{' '}
            {NIVELES_VESS.find((n) => n.sq === valores.estructuraVess)?.descripcion}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="etiqueta-campo">Compactación
            <select className="campo-entrada" defaultValue="" {...registro('compactacion')}>
              <option value="">— Sin registrar —</option>
              {COMPACTACION.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="etiqueta-campo">Infiltración
            <select className="campo-entrada" defaultValue="" {...registro('infiltracion')}>
              <option value="">— Sin registrar —</option>
              {INFILTRACION.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="etiqueta-campo">Prof. efectiva (cm)
            <input className="campo-entrada" type="number" step="1" min="0" {...registro('profundidadEfectivaCm')} />
          </label>
          <label className="etiqueta-campo">Notas libres
            <input className="campo-entrada" placeholder="Ej: granular friable" {...registro('estructuraDesc')} />
          </label>
        </div>
      </Columna>
    </>
  );
}
