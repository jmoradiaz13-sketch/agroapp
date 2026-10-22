import { useState } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import type { FotoLista } from '../../servicios/fotos';
import { CapturaFoto } from '../CapturaFoto';
import { GaugeArco } from '../GaugeArco';
import { FUENTES_BIOLOGICAS, aNumero, textoCobertura, type FotoCoberturaVista } from '../../datos/biologicas';
import { Aviso, CampoNumero, Columna, Fuente, Metodo } from './biologicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;
type Vista = 'original' | 'mascara';

export function PanelCobertura({
  registro, valores, fotoCobertura, alFotoCobertura, alUsarCobertura,
}: {
  registro: R; valores: V;
  fotoCobertura: FotoCoberturaVista | null;
  alFotoCobertura: (f: FotoLista) => Promise<void>;
  alUsarCobertura: (pct: number) => void;
}) {
  const [vista, setVista] = useState<Vista>('original');
  const pctRegistrado = aNumero(valores.coberturaVegetalPct);
  const pctFoto = fotoCobertura?.pct;
  const pct = pctRegistrado ?? pctFoto;
  const origen = pctRegistrado !== undefined
    ? 'En la ficha'
    : pctFoto !== undefined
      ? 'Calculado en la foto, aún sin usar en la ficha'
      : 'Sin dato';

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Columna titulo="Foto cenital">
        <div className="flex flex-wrap items-center gap-2">
          <CapturaFoto
            texto={fotoCobertura ? 'Repetir foto cenital' : 'Tomar foto cenital'}
            tipo="cobertura"
            alCapturar={(f) => void alFotoCobertura(f)}
          />
          {fotoCobertura && (
            <button
              type="button"
              onClick={() => alUsarCobertura(fotoCobertura.pct)}
              className="boton-campo border border-emerald-700 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              Usar {fotoCobertura.pct} % en la ficha
            </button>
          )}
        </div>

        {fotoCobertura ? (
          <div className="grid gap-2">
            <div className="relative aspect-[4/3] overflow-hidden border" style={{ borderColor: 'var(--borde)', background: 'var(--sup-2)' }}>
              <img
                src={fotoCobertura.url}
                alt="Foto cenital de cobertura"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {vista === 'mascara' && fotoCobertura.mascara && (
                <img
                  src={fotoCobertura.mascara}
                  alt="Máscara de píxeles verdes sobre la foto cenital"
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
              )}
              <span className="absolute left-2 top-2 border border-white/40 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                {vista === 'mascara' ? 'Mapa verde' : 'Original'}
              </span>
              <span
                className="absolute bottom-2 right-2 px-2.5 py-1 text-sm font-bold"
                style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#065f46' }}
              >
                {fotoCobertura.pct} %
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex border" style={{ borderColor: 'var(--borde)' }} role="group" aria-label="Vista de la foto de cobertura">
                {(['original', 'mascara'] as const).map((modo) => {
                  const activo = vista === modo;
                  const deshabilitado = modo === 'mascara' && !fotoCobertura.mascara;
                  return (
                    <button
                      key={modo}
                      type="button"
                      disabled={deshabilitado}
                      aria-pressed={activo}
                      onClick={() => setVista(modo)}
                      className="boton-campo px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
                      style={activo
                        ? { background: 'var(--marca)', color: 'var(--marca-texto)' }
                        : { background: 'transparent', color: 'var(--texto)' }}
                    >
                      {modo === 'original' ? 'Original' : 'Mapa verde'}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                La máscara se calcula en el dispositivo y no se guarda.
              </p>
            </div>
          </div>
        ) : (
          <p className="mensaje-info">Aún no hay foto de cobertura. Puedes tomarla o transcribir el porcentaje manualmente en la ficha.</p>
        )}

        <Metodo titulo="Canopeo (Patrignani & Ochsner, 2015)">
          <p>Foto vertical del dosel a 60 cm o más, con luz uniforme. El sistema cuenta píxeles verdes en el dispositivo, sin conexión.</p>
          <p className="text-xs text-neutral-500">El mapa verde es una ayuda de verificación: sirve para revisar el encuadre antes de usar el porcentaje.</p>
        </Metodo>
        <Fuente texto={FUENTES_BIOLOGICAS.cobertura} />
      </Columna>

      <Columna titulo="Cobertura registrada">
        <GaugeArco
          valor={pct}
          minimo={0}
          maximo={100}
          titulo="Cobertura"
          subtexto={origen}
          color="#14736E"
        />
        <CampoNumero
          etiqueta="Cobertura vegetal"
          unidad="%"
          nombre="coberturaVegetalPct"
          registro={registro}
          maximo={100}
          paso="0.1"
          placeholder="Ej: 68"
          ayuda="Puede venir de la foto o de una medición propia. Se guarda en la ficha."
        />
        <p className="text-xs leading-relaxed text-neutral-600">{textoCobertura(pct)}</p>
        {pctRegistrado !== undefined && pctFoto !== undefined && Math.abs(pctRegistrado - pctFoto) > 0.5 && (
          <Aviso tono="aviso">
            La cobertura de la ficha ({pctRegistrado} %) no coincide con la calculada en la foto ({pctFoto} %). Usa el botón de la foto o revisa el dato manual.
          </Aviso>
        )}
        <Aviso tono="info">
          No hay un umbral de cobertura validado en el catálogo. El porcentaje se conserva como registro y se compara con la serie temporal del lote.
        </Aviso>
        <Fuente texto={FUENTES_BIOLOGICAS.cobertura} />
      </Columna>
    </div>
  );
}
