import { useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import { CLASES_ES, clasificarTextura } from '../../datos/fisicas';
import { FlujoTextura } from './FlujoTextura';
import { AsesoriaTextura } from './AsesoriaTextura';

type Etapa = 'campo' | 'laboratorio' | 'resultado';

export function TexturaRecorrido({
  registro,
  fijar,
  valores,
  errorGranulometria,
}: {
  registro: UseFormRegister<FichaSueloFormulario>;
  fijar: UseFormSetValue<FichaSueloFormulario>;
  valores: Partial<FichaSueloFormulario>;
  errorGranulometria?: string;
}) {
  const [etapa, setEtapa] = useState<Etapa>('campo');
  const [aviso, setAviso] = useState('');
  const claseLaboratorio = clasificarTextura(valores.arenaPct, valores.limoPct, valores.arcillaPct);

  const confirmarLaboratorio = () => {
    if (!claseLaboratorio) {
      setAviso('Completa arena, limo y arcilla; deben sumar 100 ± 2 %.');
      return;
    }
    setAviso('');
    setEtapa('resultado');
  };

  const omitirLaboratorio = () => {
    setAviso('');
    setEtapa('resultado');
  };

  return (
    <div className="grid gap-4 content-start">
      {etapa === 'campo' && (
        <FlujoTextura
          fijar={fijar}
          valorActual={valores.texturaTacto}
          alTerminarTacto={() => setEtapa('laboratorio')}
        />
      )}

      {etapa === 'laboratorio' && (
        <div key="laboratorio" className="animacion-entrada grid gap-4 content-start">
          <div className="grid max-w-[62ch] gap-1">
            <span className="mono-micro" style={{ color: 'var(--acento)' }}>Textura · paso 2</span>
            <h3 className="font-display text-xl font-medium leading-tight" style={{ color: 'var(--texto)' }}>
              Laboratorio · granulometría %
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Transcribe los porcentajes del reporte de laboratorio. Si no cuentas con este análisis,
              omite el paso: la clase determinada al tacto queda registrada.
            </p>
          </div>

          <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
            <label className="etiqueta-campo">Arena (%)
              <input className="campo-entrada" type="number" step="0.1" min="0" max="100" {...registro('arenaPct')} />
            </label>
            <label className="etiqueta-campo">Limo (%)
              <input className="campo-entrada" type="number" step="0.1" min="0" max="100" {...registro('limoPct')} />
            </label>
            <label className="etiqueta-campo">Arcilla (%)
              <input className="campo-entrada" type="number" step="0.1" min="0" max="100" {...registro('arcillaPct')} />
            </label>
          </div>

          {claseLaboratorio && (
            <p className="mensaje-ok">Clase USDA: {CLASES_ES[claseLaboratorio]}</p>
          )}
          {errorGranulometria && <p className="mensaje-error">{errorGranulometria}</p>}
          {aviso && !claseLaboratorio && <p className="mensaje-error">{aviso}</p>}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={confirmarLaboratorio}
              className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: 'var(--marca)', color: 'var(--marca-texto)' }}
            >
              Confirmar porcentajes <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              onClick={omitirLaboratorio}
              className="boton-campo inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: 'transparent', color: 'var(--texto)', border: '1px solid var(--borde)' }}
            >
              Omitir
            </button>
          </div>
        </div>
      )}

      {etapa === 'resultado' && (
        <div key="resultado" className="animacion-entrada grid gap-4 content-start">
          <div className="grid max-w-[62ch] gap-1">
            <span className="mono-micro" style={{ color: 'var(--acento)' }}>Textura · resultados</span>
            <h3 className="font-display text-xl font-medium leading-tight" style={{ color: 'var(--texto)' }}>
              Resultados de textura
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Contraste entre la prueba al tacto y la granulometría de laboratorio.
            </p>
          </div>
          <AsesoriaTextura valores={valores} />
        </div>
      )}
    </div>
  );
}
