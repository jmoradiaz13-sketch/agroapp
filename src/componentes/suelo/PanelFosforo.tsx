import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  FUENTES_QUIMICAS, METODOS_FOSFORO, OPCIONES_CARBONATOS, aNumero, textoFosforo,
} from '../../datos/quimicas';
import {
  Aviso, CampoNumero, CampoSelect, Columna, Fuente, MedidorLineal, Metodo, SemaforoParametro,
} from './quimicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

const MICROS = [
  { id: 'hierroMgKg', etiqueta: 'Hierro', simbolo: 'Fe' },
  { id: 'manganesoMgKg', etiqueta: 'Manganeso', simbolo: 'Mn' },
  { id: 'zincMgKg', etiqueta: 'Zinc', simbolo: 'Zn' },
  { id: 'cobreMgKg', etiqueta: 'Cobre', simbolo: 'Cu' },
  { id: 'boroMgKg', etiqueta: 'Boro', simbolo: 'B' },
] as const;

export function PanelFosforo({ registro, valores }: { registro: R; valores: V }) {
  const fosforo = aNumero(valores.fosforoMgKg);
  const metodo = valores.metodoFosforo;
  const carbonatos = valores.carbonatos;
  const microsRegistrados = MICROS.filter((m) => aNumero(valores[m.id]) !== undefined);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Columna titulo="Registro de fósforo y microelementos">
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoNumero
            etiqueta="Fósforo disponible" unidad="mg/kg" nombre="fosforoMgKg" registro={registro}
            maximo={500} paso="0.1" placeholder="Ej: 22"
            rango="Referencia 15–40 mg/kg"
          />
          <CampoSelect
            etiqueta="Método extractante de P" nombre="metodoFosforo" registro={registro}
            opciones={METODOS_FOSFORO.map((m) => ({ valor: m, texto: m }))}
            ayuda="Bray II y Olsen no son intercambiables."
          />
          <CampoNumero etiqueta="Azufre" unidad="mg/kg" nombre="azufreMgKg" registro={registro} maximo={2000} paso="0.1" placeholder="Ej: 12" />
          {MICROS.map((m) => (
            <CampoNumero
              key={m.id}
              etiqueta={`${m.etiqueta} (${m.simbolo})`}
              unidad="mg/kg"
              nombre={m.id}
              registro={registro}
              maximo={2000}
              paso="0.1"
              placeholder="Ej: 8,5"
            />
          ))}
          <CampoSelect
            etiqueta="Carbonatos (HCl / vinagre)" nombre="carbonatos" registro={registro}
            opciones={OPCIONES_CARBONATOS.map((c) => ({ valor: c, texto: c }))}
          />
          <label className="etiqueta-campo sm:col-span-2">Síntomas visuales en plantas
            <textarea
              className="campo-entrada min-h-[72px]"
              placeholder="Ej: clorosis en hojas inferiores"
              {...registro('sintomasVisuales')}
            />
          </label>
        </div>
        <Metodo titulo="Doble ácido + absorción atómica (SENA La Granja, práctica 13)">
          <p>Los micronutrientes se extraen con HCl + H₂SO₄ (método Carolina del Norte) y se leen por absorción atómica. Para fósforo, registra siempre el extractante (Bray II u Olsen).</p>
          <p className="text-xs text-neutral-500">Sin el método, el valor de P no es trazable frente al rango de referencia.</p>
        </Metodo>
        {fosforo !== undefined && !metodo && (
          <Aviso tono="aviso">Registra el método extractante para que el valor de fósforo sea comparable y trazable.</Aviso>
        )}
        <Fuente texto={FUENTES_QUIMICAS.fosforo} />
      </Columna>

      <Columna titulo="Lectura de fósforo y micros">
        <MedidorLineal
          titulo="Fósforo disponible"
          valor={fosforo}
          minimo={0}
          maximo={100}
          optimoMin={15}
          optimoMax={40}
          unidad="mg/kg"
          estado={<SemaforoParametro parametro="fosforoMgKg" valor={fosforo} />}
          texto={textoFosforo(fosforo)}
        />

        <div className="grid gap-1 border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Método registrado</p>
          <p className="text-sm font-medium text-humus">{metodo ?? 'Sin registrar'}</p>
          <p className="text-xs leading-relaxed text-neutral-500">
            El rango de fósforo depende del extractante y del laboratorio. No se promedian métodos distintos.
          </p>
        </div>

        <div className="grid gap-1.5 border border-neutral-200 bg-white p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Microelementos</p>
          {microsRegistrados.length > 0 ? (
            <ul className="grid gap-0.5 text-xs text-neutral-600">
              {microsRegistrados.map((m) => (
                <li key={m.id} className="flex justify-between gap-3">
                  <span>{m.simbolo} · {m.etiqueta}</span>
                  <span className="font-medium text-humus">{aNumero(valores[m.id])} mg/kg</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Sin registrar</p>
          )}
          <p className="text-[11px] leading-snug text-neutral-500">
            Solo registro: las fuentes del proyecto no traen rangos validados para estos elementos en el contexto de esta ficha.
          </p>
        </div>

        <div className="grid gap-1.5 border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Carbonatos</p>
          <div className="flex flex-wrap gap-1" role="list" aria-label="Reacción a HCl">
            {OPCIONES_CARBONATOS.map((o) => (
              <span
                key={o}
                role="listitem"
                className={`border px-2 py-1 text-xs ${carbonatos === o ? 'border-emerald-700 bg-emerald-50 font-semibold text-emerald-800' : 'border-neutral-200 text-neutral-500'}`}
              >
                {o}
              </span>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-neutral-500">
            {carbonatos ? `Reacción registrada: ${carbonatos}.` : 'Sin registrar. La efervescencia con HCl se anota como observación de campo.'}
          </p>
        </div>

        {valores.sintomasVisuales && (
          <div className="grid gap-1 border border-neutral-200 bg-white p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Síntomas visuales</p>
            <p className="text-xs leading-relaxed text-neutral-600">{valores.sintomasVisuales}</p>
          </div>
        )}
      </Columna>
    </div>
  );
}
