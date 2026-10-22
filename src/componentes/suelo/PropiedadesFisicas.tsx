import { useEffect, useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import type { FotoLista } from '../../servicios/fotos';
import {
  CLASES_ES, clasificarTextura,
  claseDeEtiqueta,
  FUENTE_MUNSELL,
  FUENTE_DENSIDAD,
  interpretarPorosidad, FUENTE_POROSIDAD,
  FUENTE_AGUA, calcularAguaDisponible,
  FUENTE_VESS,
} from '../../datos/fisicas';
import {
  Fuente, Columna, Triangulo, SemaforoDensidad,
} from './fisicas_apoyo';
import { FlujoTextura } from './FlujoTextura';
import { AsesoriaTextura } from './AsesoriaTextura';
import { FlujoColor } from './FlujoColor';
import { AsesoriaColor } from './AsesoriaColor';
import { FlujoDensidad } from './FlujoDensidad';
import { AsesoriaDensidad } from './AsesoriaDensidad';
import { FlujoEstructura } from './FlujoEstructura';
import { AsesoriaEstructura } from './AsesoriaEstructura';
import { AyudaCampo } from '../AyudaCampo';
import { CapturaFoto } from '../CapturaFoto';
import { VARIABLES_FISICAS, estadoVariable } from '../../datos/variables_suelo';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export const DIAPOSITIVAS_FISICAS: { id: string; titulo: string }[] = [
  { id: 'textura', titulo: 'Textura' },
  { id: 'color', titulo: 'Color' },
  { id: 'densidad', titulo: 'Densidad' },
  { id: 'estructura', titulo: 'Estructura' },
  { id: 'conclusiones', titulo: 'Conclusiones' },
];

const DIAPOSITIVAS = DIAPOSITIVAS_FISICAS;

// Cada variable del índice apunta a su diapositiva: agua y densidad comparten
// la 2, estructura es la 3 y la 4 cierra con las conclusiones.
export const SLIDE_DE_VARIABLE_FISICA: Record<string, number> = {
  textura: 0, color: 1, densidad: 2, agua: 2, estructura: 3,
};

export function variableFisicaDeSlide(indice: number): string | null {
  return ['textura', 'color', 'densidad', 'estructura', null][indice] ?? null;
}

// Deck estilo curso/MOOC: una variable por diapositiva con fundamentos,
// medición y captura DUO (campo + laboratorio), hasta conclusiones.
export function PropiedadesFisicas({
  registro, fijar, valores, errorGranulometria, alFoto, alIrResumen, diapositiva,
}: {
  registro: R; fijar: UseFormSetValue<FichaSueloFormulario>; valores: V; errorGranulometria?: string;
  alFoto?: (f: FotoLista) => void; alIrResumen?: () => void; diapositiva?: number | null;
}) {
  const [indice, setIndice] = useState(0);

  const auto = clasificarTextura(valores.arenaPct, valores.limoPct, valores.arcillaPct);
  const claseDensidad = auto ?? claseDeEtiqueta(valores.texturaTacto);

  const irA = (i: number) => setIndice(Math.max(0, Math.min(DIAPOSITIVAS.length - 1, i)));

  useEffect(() => {
    if (diapositiva !== undefined && diapositiva !== null) irA(diapositiva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diapositiva]);

  return (
    <div className="grid gap-3">
      {/* Encabezado compacto de la variable de esta diapositiva.
          key única: no debe coincidir con la de la tarjeta de abajo (hermanos con la misma key dejan fantasmas en el DOM). */}
      <div key={`titulo-${indice}`} className="animacion-entrada border-b-2 pb-1" style={{ borderColor: 'var(--acento)' }}>
        <h3 className="text-lg font-semibold leading-tight text-humus">{DIAPOSITIVAS[indice].titulo}</h3>
      </div>
      <div key={indice} className="animacion-entrada bg-white border border-emerald-500/40 shadow-sm rounded-sm p-4 sm:p-5 grid gap-3 lg:grid-cols-3 content-start">
        {indice === 0 && (
          <>
            <div className="lg:col-span-3">
              <FlujoTextura fijar={fijar} valorActual={valores.texturaTacto} />
            </div>
            <Columna titulo="Fundamentos">
              <p className="text-sm text-neutral-600">Arena (2–0,05 mm), limo (0,05–0,002 mm) y arcilla (&lt; 0,002 mm) definen retención de agua, aireación y manejo.</p>
              <Triangulo arena={valores.arenaPct ?? 40} limo={valores.limoPct ?? 40} arcilla={valores.arcillaPct ?? 20} clase={auto ? CLASES_ES[auto] : 'ejemplo'} />
              <Fuente texto="FAO, Guidelines for Soil Description; USDA-NRCS, Soil Survey Manual" />
            </Columna>
            <Columna titulo="Laboratorio · granulometría %">
              <p className="text-sm text-neutral-600">Si cuentas con el análisis de laboratorio, registra los porcentajes para confirmar la clase USDA.</p>
              <div className="grid grid-cols-3 gap-2">
                <label className="etiqueta-campo">Arena
                  <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('arenaPct')} />
                </label>
                <label className="etiqueta-campo">Limo
                  <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('limoPct')} />
                </label>
                <label className="etiqueta-campo">Arcilla
                  <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('arcillaPct')} />
                </label>
              </div>
              {errorGranulometria && <p className="mensaje-error">{errorGranulometria}</p>}
              {auto && <p className="mensaje-ok">Clase USDA: {CLASES_ES[auto]}</p>}
              <p className="mensaje-info">Esmectita (2:1) se siente jabonosa aun con % moderado; caolinita (1:1), menos plástica.</p>
            </Columna>
            <Columna titulo="Asesoría de la textura">
              <AsesoriaTextura valores={valores} />
            </Columna>
          </>
        )}

        {indice === 1 && (
          <>
            <div className="lg:col-span-3">
              <FlujoColor fijar={fijar} valores={valores} />
            </div>
            <Columna titulo="Fundamentos">
              <p className="text-sm text-neutral-600">El color indica materia orgánica, óxidos de hierro y drenaje: negros (humus fértil), rojos (hematita, oxidación), grises (anaerobio).</p>
              <img src="/imagenes/metodos/munsell-sistema.svg" alt="Diagrama del sistema de color Munsell" loading="lazy" className="w-full max-w-[220px]" />
              <p className="text-[11px] text-neutral-500">Sistema Munsell (Jacob Rus, CC-BY-SA 3.0, Wikimedia Commons).</p>
              <Fuente texto={`USDA-NRCS, Soil Survey Manual. ${FUENTE_MUNSELL}`} />
            </Columna>
            <Columna titulo="Asesoría del color" className="lg:col-span-2">
              <AsesoriaColor valores={valores} />
            </Columna>
          </>
        )}

        {indice === 2 && (
          <>
            <div className="lg:col-span-3">
              <FlujoDensidad fijar={fijar} valores={valores} claseTextural={claseDensidad} />
            </div>
            <Columna titulo="Fundamentos">
              <p className="text-sm text-neutral-600">DA = masa seca ÷ volumen. Refleja compactación y porosidad total: valores altos frenan raíces y agua.</p>
              <img src="/imagenes/metodos/perfil-suelo.jpg" alt="Perfil de suelo con horizontes diferenciados" loading="lazy" className="w-full max-w-[220px] rounded-sm" />
              <p className="text-[11px] text-neutral-500">Perfil con horizontes (USDA, dominio público). La densidad aumenta con la profundidad.</p>
              <Fuente texto={FUENTE_DENSIDAD} />
            </Columna>
            <Columna titulo="Laboratorio · reporte">
              <label className="etiqueta-campo">DR real (g/cm³)
                <input className="campo-entrada" type="number" step="0.01" min="0" {...registro('densidadReal')} />
              </label>
              <label className="etiqueta-campo">Porosidad (%)
                <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('porosidadPct')} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="etiqueta-campo">CC · capacidad de campo (%)
                  <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('capacidadCampoPct')} />
                </label>
                <label className="etiqueta-campo">PMP · marchitez permanente (%)
                  <input className="campo-entrada" type="number" step="0.1" min="0" {...registro('pmpPct')} />
                </label>
              </div>
              <AyudaCampo
                titulo="CC, PMP y agua disponible"
                porque="La capacidad de campo es el agua retenida a −10/−33 kPa y el punto de marchitez a −1500 kPa. Lo retenido cerca de −10 kPa es fácilmente disponible y vive en poros de 0,2–50 µm."
                como="Registra CC y PMP del reporte; el agua disponible (CC − PMP) se calcula sola. Si PMP supera a CC, revisa el reporte: es físicamente imposible."
                fuente={FUENTE_AGUA}
              />
              {(() => {
                const cc = valores.capacidadCampoPct;
                const pmp = valores.pmpPct;
                if (cc === undefined || pmp === undefined) return null;
                if (pmp > cc) {
                  return <p className="mensaje-error">PMP ({pmp} %) mayor que CC ({cc} %): imposible en campo. Verifica el reporte de laboratorio.</p>;
                }
                return (
                  <p className="mensaje-ok">
                    Agua disponible ≈ <strong className="font-semibold">{calcularAguaDisponible(cc, pmp)} %</strong> (CC − PMP, calculado, no se almacena).
                  </p>
                );
              })()}
            </Columna>
            <Columna titulo="Asesoría de la densidad">
              <AsesoriaDensidad valores={valores} claseTextural={claseDensidad} />
            </Columna>
          </>
        )}

        {indice === 3 && (
          <>
            <div className="lg:col-span-3">
              <FlujoEstructura fijar={fijar} valores={valores} />
            </div>
            <Columna titulo="Fundamentos">
              <p className="text-sm text-neutral-600">El arreglo de agregados y poros regula agua, aire y raíces. VESS puntúa de Sq1 (friable) a Sq5 (macizo).</p>
              <img src="/imagenes/3.jpg" alt="Agregados, raíces y poros del suelo en primer plano" loading="lazy" className="w-full max-w-[220px] rounded-sm" />
              <Fuente texto={FUENTE_VESS} />
            </Columna>
            <Columna titulo="Medición en campo">
              <p className="text-sm font-medium">Extrae un bloque de 20 cm sin pisar el borde, ábrelo como un libro y observa terrones, poros y raíces por capa. Puntúa cada capa y promedia por espesor.</p>
              {alFoto && (
                <div>
                  <CapturaFoto texto="Foto del bloque VESS" tipo="vess" alCapturar={alFoto} />
                  <p className="text-[11px] text-neutral-400 mt-1">Se guarda con la ficha al presionar Guardar.</p>
                </div>
              )}
            </Columna>
            <Columna titulo="Asesoría de la estructura">
              <AsesoriaEstructura valores={valores} />
            </Columna>
          </>
        )}

        {indice === 4 && (
          <>
            <Columna titulo="Resumen">
              <dl className="grid gap-1.5 text-sm">
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Textura</dt><dd className="font-medium">{valores.texturaTacto ?? (auto ? CLASES_ES[auto] : 'Sin registrar')}</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Color</dt><dd className="font-medium">{valores.munsellH ? `${valores.munsellH} ${valores.munsellV ?? '?'} / ${valores.munsellC ?? '?'}` : 'Sin registrar'}</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Densidad</dt><dd className="font-medium">{valores.densidadAparente !== undefined ? `${valores.densidadAparente} g/cm³` : 'Sin registrar'}</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-24 shrink-0">Agua</dt><dd className="font-medium">{
                  valores.capacidadCampoPct !== undefined && valores.pmpPct !== undefined
                    ? `CC ${valores.capacidadCampoPct} % · PMP ${valores.pmpPct} % · disponible ≈ ${calcularAguaDisponible(valores.capacidadCampoPct, valores.pmpPct) ?? '?'} %`
                    : 'Sin registrar'
                }</dd></div>
                <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Estructura</dt><dd className="font-medium">{valores.estructuraVess !== undefined ? `VESS Sq${valores.estructuraVess}` : (valores.estructuraDesc ?? 'Sin registrar')}</dd></div>
              </dl>
            </Columna>
            <Columna titulo="Interpretación física (siempre disponible)">
              {valores.densidadAparente !== undefined && claseDensidad ? (
                <SemaforoDensidad da={valores.densidadAparente} clase={claseDensidad} />
              ) : (
                <p className="text-sm text-neutral-500">Sin densidad + textura no hay semáforo, pero sí interpretación: usa VESS e infiltración como proxy y confirma con cilindro.</p>
              )}
              {valores.porosidadPct !== undefined && (
                <p className="text-sm">Porosidad: <strong className="font-semibold">{valores.porosidadPct} % ({interpretarPorosidad(valores.porosidadPct)})</strong></p>
              )}
              <div className="grid gap-2 mt-2">
                {VARIABLES_FISICAS.map((v) => {
                  const e = estadoVariable(v, valores);
                  if (e.estado === 'registrada') return null;
                  return (
                    <p key={v.id} className="text-xs text-neutral-600 border border-neutral-200 bg-neutral-50 p-2">
                      <strong className="font-semibold">{v.titulo} ({e.conDato}/{v.campos.length}):</strong> {v.sinDatosQueDecir} Para confirmar: {v.paraConfirmar}
                    </p>
                  );
                })}
              </div>
              <Fuente texto={`${FUENTE_DENSIDAD}; ${FUENTE_POROSIDAD}`} />
            </Columna>
            <Columna titulo="Relacionadas">
              <p className="text-sm text-neutral-600">Las conclusiones físicas alimentan la interpretación general de la ficha.</p>
              {alIrResumen && (
                <div>
                  <button type="button" onClick={alIrResumen} className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-[#047857] transition-colors">
                    Ir a Interpretación →
                  </button>
                </div>
              )}
            </Columna>
          </>
        )}
      </div>
    </div>
  );
}
