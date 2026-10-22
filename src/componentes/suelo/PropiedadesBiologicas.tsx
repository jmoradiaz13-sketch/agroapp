import { useEffect, useRef, useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import type { FotoLista } from '../../servicios/fotos';
import {
  META_BIOLOGICA, PASOS_BIOLOGICOS, SLIDE_DE_VARIABLE_BIOLOGICA, avanceVsa, estadoVsa,
  puntajesVsa, type FotoCoberturaVista,
} from '../../datos/biologicas';
import { VARIABLES_BIOLOGICAS, estadoVariable, type EstadoVariable } from '../../datos/variables_suelo';
import { CabeceraVariable } from './biologicas_apoyo';
import { PanelVida } from './PanelVida';
import { PanelVsa } from './PanelVsa';
import { PanelCobertura } from './PanelCobertura';
import { PanelLaboratorio } from './PanelLaboratorio';
import { ResumenBiologico } from './ResumenBiologico';
import { PieDeck, TiraPasos, useNavegacionDeck, type PasoDeck } from './NavegacionDeck';

type R = UseFormRegister<FichaSueloFormulario>;
type S = UseFormSetValue<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export const DIAPOSITIVAS_BIOLOGICAS: { id: string; titulo: string }[] = PASOS_BIOLOGICOS.map(({ id, titulo }) => ({ id, titulo }));

const IDS_VARIABLES = ['vida', 'vsa', 'cobertura', 'laboratorio'] as const;

function avanceDeVariable(id: string, valores: V, vsa: ReturnType<typeof puntajesVsa>): number {
  if (id === 'vsa') return avanceVsa(vsa);
  const def = VARIABLES_BIOLOGICAS.find((v) => v.id === id);
  return def ? estadoVariable(def, valores).avance : 0;
}

export function PropiedadesBiologicas({
  registro, fijar, valores, puntajes, setPuntajes,
  fotoCobertura, alFotoCobertura, alUsarCobertura,
  alIrResumen, alNavegar, diapositiva,
}: {
  registro: R; fijar: S; valores: V;
  puntajes: Record<string, number>; setPuntajes: (p: Record<string, number>) => void;
  fotoCobertura: FotoCoberturaVista | null;
  alFotoCobertura: (f: FotoLista) => Promise<void>;
  alUsarCobertura: (pct: number) => void;
  alIrResumen?: () => void; alNavegar?: (indice: number) => void; diapositiva?: number | null;
}) {
  const [indice, setIndice] = useState(0);
  const primerRender = useRef(true);
  const resumenVsa = puntajesVsa(puntajes);

  const estados: Record<string, EstadoVariable> = {
    vida: estadoVariable(VARIABLES_BIOLOGICAS.find((v) => v.id === 'vida')!, valores).estado,
    vsa: estadoVsa(resumenVsa),
    cobertura: estadoVariable(VARIABLES_BIOLOGICAS.find((v) => v.id === 'cobertura')!, valores).estado,
    laboratorio: estadoVariable(VARIABLES_BIOLOGICAS.find((v) => v.id === 'laboratorio')!, valores).estado,
  };
  const estadoCierre: EstadoVariable = IDS_VARIABLES.every((id) => estados[id] === 'registrada')
    ? 'registrada'
    : IDS_VARIABLES.some((id) => estados[id] !== 'pendiente')
      ? 'en_progreso'
      : 'pendiente';
  const pasos: PasoDeck[] = PASOS_BIOLOGICOS.map((p) => ({
    ...p,
    estado: p.id === 'conclusiones' ? estadoCierre : estados[p.id] ?? 'pendiente',
  }));
  const avanceCierre = Math.round(
    IDS_VARIABLES.reduce((total, id) => total + avanceDeVariable(id, valores, resumenVsa), 0) / IDS_VARIABLES.length,
  );
  const avanceActual = indice === PASOS_BIOLOGICOS.length - 1
    ? avanceCierre
    : avanceDeVariable(PASOS_BIOLOGICOS[indice].id, valores, resumenVsa);
  const metaActual = META_BIOLOGICA[PASOS_BIOLOGICOS[indice].id];

  const irA = (i: number, avisar = true) => {
    const destino = Math.max(0, Math.min(PASOS_BIOLOGICOS.length - 1, i));
    setIndice(destino);
    if (avisar) alNavegar?.(destino);
  };

  useEffect(() => {
    if (diapositiva !== undefined && diapositiva !== null) irA(diapositiva, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diapositiva]);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    document.getElementById('bio-paso-titulo')?.focus({ preventScroll: true });
  }, [indice]);

  const gestos = useNavegacionDeck({
    actual: indice,
    total: PASOS_BIOLOGICOS.length,
    alCambiar: (i) => irA(i),
  });

  return (
    <div
      className="bio-deck grid gap-3"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={gestos.alTocarInicio}
      onTouchEnd={gestos.alTocarFin}
      onTouchCancel={gestos.alCancelarToque}
    >
      <TiraPasos pasos={pasos} actual={indice} alCambiar={(i) => irA(i)} />

      <p className="sr-only" aria-live="polite">
        Paso {indice + 1} de {PASOS_BIOLOGICOS.length}: {PASOS_BIOLOGICOS[indice].titulo}
      </p>

      <CabeceraVariable
        meta={metaActual}
        estado={pasos[indice].estado}
        avance={avanceActual}
        paso={indice + 1}
        total={PASOS_BIOLOGICOS.length}
      />

      <div key={indice} className="animacion-entrada grid gap-3">
        {indice === 0 && <PanelVida registro={registro} fijar={fijar} valores={valores} />}
        {indice === 1 && <PanelVsa puntajes={puntajes} setPuntajes={setPuntajes} />}
        {indice === 2 && (
          <PanelCobertura
            registro={registro}
            valores={valores}
            fotoCobertura={fotoCobertura}
            alFotoCobertura={alFotoCobertura}
            alUsarCobertura={alUsarCobertura}
          />
        )}
        {indice === 3 && <PanelLaboratorio registro={registro} valores={valores} />}
        {indice === 4 && (
          <ResumenBiologico
            valores={valores}
            puntajes={puntajes}
            fotoCobertura={fotoCobertura}
            alElegir={(id) => irA(SLIDE_DE_VARIABLE_BIOLOGICA[id] ?? 0)}
            alIrResumen={alIrResumen}
          />
        )}
      </div>

      <PieDeck pasos={pasos} actual={indice} alCambiar={(i) => irA(i)} alCerrar={alIrResumen} />
    </div>
  );
}
