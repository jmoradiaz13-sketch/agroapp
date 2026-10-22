import { useEffect, useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { SLIDE_DE_VARIABLE_QUIMICA } from '../../datos/quimicas';
import { PanelAcidez } from './PanelAcidez';
import { PanelSalinidad } from './PanelSalinidad';
import { PanelMateriaOrganica } from './PanelMateriaOrganica';
import { PanelBases } from './PanelBases';
import { PanelFosforo } from './PanelFosforo';
import { ResumenQuimico } from './ResumenQuimico';

type R = UseFormRegister<FichaSueloFormulario>;
type S = UseFormSetValue<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export const DIAPOSITIVAS_QUIMICAS: { id: string; titulo: string }[] = [
  { id: 'acidez', titulo: 'Acidez' },
  { id: 'salinidad', titulo: 'Salinidad' },
  { id: 'materia', titulo: 'MO y N' },
  { id: 'bases', titulo: 'Bases y CIC' },
  { id: 'fosforo', titulo: 'P y micros' },
  { id: 'conclusiones', titulo: 'Conclusiones' },
];

const DIAPOSITIVAS = DIAPOSITIVAS_QUIMICAS;

const PROPOSITO: Record<string, string> = {
  acidez: 'Registra las lecturas de pH y observa su posición en la escala. La interpretación depende del cultivo.',
  salinidad: 'Separa la CE de laboratorio de la lectura portátil y ubica el valor frente al rango validado.',
  materia: 'Registra materia orgánica y nitrógeno total; cada uno se lee con su propio rango.',
  bases: 'Transcribe cationes y CIC; el balance y la saturación de Al se calculan en vivo.',
  fosforo: 'Asocia el fósforo con su método extractante y deja los micros como registro.',
  conclusiones: 'Revisa la cobertura, las incoherencias y lo que falta antes de guardar la ficha.',
};

export function PropiedadesQuimicas({
  registro, fijar, valores, alIrResumen, alNavegar, diapositiva,
}: {
  registro: R; fijar: S; valores: V;
  alIrResumen?: () => void; alNavegar?: (indice: number) => void; diapositiva?: number | null;
}) {
  const [indice, setIndice] = useState(0);
  const irA = (i: number, avisar = false) => {
    const destino = Math.max(0, Math.min(DIAPOSITIVAS.length - 1, i));
    setIndice(destino);
    if (avisar) alNavegar?.(destino);
  };

  useEffect(() => {
    if (diapositiva !== undefined && diapositiva !== null) irA(diapositiva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diapositiva]);

  return (
    <div className="grid gap-3">
      <div key={`titulo-${indice}`} className="animacion-entrada border-b-2 pb-1" style={{ borderColor: 'var(--acento)' }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-humus">{DIAPOSITIVAS[indice].titulo}</h3>
          <span className="mono-micro" style={{ color: 'var(--muted)' }}>
            Variable {indice + 1} de {DIAPOSITIVAS.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{PROPOSITO[DIAPOSITIVAS[indice].id]}</p>
      </div>

      <div key={indice} className="animacion-entrada grid gap-3">
        {indice === 0 && <PanelAcidez registro={registro} valores={valores} />}
        {indice === 1 && <PanelSalinidad registro={registro} valores={valores} />}
        {indice === 2 && <PanelMateriaOrganica registro={registro} valores={valores} />}
        {indice === 3 && <PanelBases registro={registro} fijar={fijar} valores={valores} />}
        {indice === 4 && <PanelFosforo registro={registro} valores={valores} />}
        {indice === 5 && (
          <ResumenQuimico
            valores={valores}
            alElegir={(id) => irA(SLIDE_DE_VARIABLE_QUIMICA[id] ?? 0, true)}
            alIrResumen={alIrResumen}
          />
        )}
      </div>
    </div>
  );
}
