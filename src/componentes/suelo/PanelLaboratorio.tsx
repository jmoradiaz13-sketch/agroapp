import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  FUENTES_BIOLOGICAS, aNumero, textoCarbonoBiomasa, textoMicorrizas, textoRespiracion,
} from '../../datos/biologicas';
import {
  Aviso, CampoNumero, CampoTexto, Columna, Fuente, Metodo, SelloEstado, ValorSinRango,
} from './biologicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export function PanelLaboratorio({ registro, valores }: { registro: R; valores: V }) {
  const respiracion = aNumero(valores.respiracionSuelo);
  const biomasa = aNumero(valores.carbonoBiomasa);
  const micorrizas = valores.micorrizas?.trim();

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <Columna titulo="Registro del reporte">
        <div className="flex flex-wrap gap-1.5" aria-label="Estado de los datos de laboratorio">
          <SelloEstado etiqueta="Respiración" hecho={respiracion !== undefined} />
          <SelloEstado etiqueta="Biomasa" hecho={biomasa !== undefined} />
          <SelloEstado etiqueta="Micorrizas" hecho={Boolean(micorrizas)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <CampoNumero
            etiqueta="Respiración basal"
            unidad="mg C-CO₂/kg/día"
            nombre="respiracionSuelo"
            registro={registro}
            maximo={10000}
            paso="0.1"
            placeholder="Ej: 12,4"
            ayuda="CO₂ liberado por la comunidad microbiana en el reporte."
          />
          <CampoNumero
            etiqueta="Carbono de biomasa microbiana"
            unidad="mg/kg"
            nombre="carbonoBiomasa"
            registro={registro}
            maximo={10000}
            paso="0.1"
            placeholder="Ej: 180"
            ayuda="Carbono de la biomasa microbiana del reporte."
          />
        </div>

        <CampoTexto
          etiqueta="Colonización micorrízica"
          nombre="micorrizas"
          registro={registro}
          placeholder="Ej: 60 % de raíces colonizadas"
          ayuda="Transcribe el dato cualitativo o el porcentaje del reporte."
          maxLength={100}
        />

        <Metodo titulo="Respiración, biomasa y micorrizas del reporte">
          <p>La respiración basal mide el CO₂ liberado por la actividad microbiana. El carbono de biomasa y la colonización micorrízica provienen del mismo informe de laboratorio.</p>
          <p className="text-xs text-neutral-500">Registra el valor en la unidad indicada. Si el reporte usa otra, conviértelo antes de escribirlo.</p>
        </Metodo>
        <Fuente texto={FUENTES_BIOLOGICAS.laboratorio} />
      </Columna>

      <Columna titulo="Lectura del laboratorio">
        <div className="grid gap-2 sm:grid-cols-2">
          <ValorSinRango titulo="Respiración basal" valor={respiracion} unidad="mg C-CO₂/kg/día" />
          <ValorSinRango titulo="Carbono de biomasa" valor={biomasa} unidad="mg/kg" />
        </div>

        <div className="grid content-start gap-1 border border-neutral-200 bg-white p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Colonización micorrízica</p>
          <p className="text-sm font-medium text-humus">{micorrizas !== undefined && micorrizas !== '' ? micorrizas : 'Sin registrar'}</p>
          <span className="w-fit border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] text-neutral-500">Registro cualitativo</span>
          <p className="text-[11px] leading-snug text-neutral-500">{textoMicorrizas(micorrizas)}</p>
        </div>

        <p className="text-xs leading-relaxed text-neutral-600">{textoRespiracion(respiracion)}</p>
        <p className="text-xs leading-relaxed text-neutral-600">{textoCarbonoBiomasa(biomasa)}</p>
        <Aviso tono="info">
          Estos parámetros no tienen umbral validado en el catálogo. Se guardan como serie temporal y no se clasifican como buenos o malos.
        </Aviso>
      </Columna>
    </div>
  );
}
