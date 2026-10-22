import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  FUENTES_QUIMICAS, aNumero, deltaPh, textoDeltaPh, textoPh,
} from '../../datos/quimicas';
import { CampoNumero, Columna, EscalaPh, Fuente, Metodo } from './quimicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export function PanelAcidez({ registro, valores }: { registro: R; valores: V }) {
  const agua = aNumero(valores.phAgua);
  const kcl = aNumero(valores.phKcl);
  const campo = aNumero(valores.phCampo);
  const principal = agua ?? campo;
  const delta = deltaPh(agua, kcl);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <Columna titulo="Registro del pH">
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoNumero
            etiqueta="pH en agua" unidad="pH" nombre="phAgua" registro={registro}
            maximo={14} paso="0.1" placeholder="Ej: 5.8"
            ayuda="Relación 1:1 o 1:2,5 según el laboratorio."
          />
          <CampoNumero
            etiqueta="pH en KCl" unidad="pH" nombre="phKcl" registro={registro}
            maximo={14} paso="0.1" placeholder="Ej: 4.9"
            ayuda="Mide la acidez intercambiable."
          />
          <CampoNumero
            etiqueta="pH portátil o tiras" unidad="pH" nombre="phCampo" registro={registro}
            maximo={14} paso="0.1" placeholder="Ej: 6.0"
            ayuda="Lectura de campo orientativa."
          />
        </div>
        <Metodo titulo="Potenciómetro (SENA La Granja, práctica 4)">
          <p>20 g de suelo tamizado a 2 mm + 20 ml de agua destilada. Agita, deja reposar 30 min y mide con el electrodo calibrado con buffers pH 7 y 4. Lava el electrodo entre lecturas.</p>
          <p className="text-xs text-neutral-500">Registra siempre el método y la relación suelo:agua del reporte.</p>
        </Metodo>
        <p className="mensaje-info">
          El pH no tiene un óptimo único: depende del cultivo. La app muestra el valor y su posición en la escala, sin clasificarlo como bueno o malo.
        </p>
        <Fuente texto={FUENTES_QUIMICAS.acidez} />
      </Columna>

      <Columna titulo="Lectura del pH">
        <EscalaPh ph={principal} />
        <p className="text-sm leading-relaxed text-neutral-700">{textoPh(principal)}</p>

        <div className="grid gap-1 border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">ΔpH (KCl − agua)</p>
          <p className="text-lg font-semibold text-humus">
            {delta !== null ? `${delta > 0 ? '+' : ''}${delta}` : '—'}
            <span className="ml-1 text-xs font-normal text-neutral-500">unidades</span>
          </p>
          <p className="text-xs leading-relaxed text-neutral-600">{textoDeltaPh(delta)}</p>
        </div>

        <div className="grid gap-1 border border-neutral-200 bg-white p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Si el reporte trae varios pH</p>
          <p className="text-xs leading-relaxed text-neutral-600">
            Se conserva cada lectura por separado. La escala usa el pH en agua y, si falta, el pH de campo. El pH en KCl queda como dato de apoyo.
          </p>
        </div>
      </Columna>
    </div>
  );
}
