import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  FUENTES_QUIMICAS, aNumero, textoSalinidad,
} from '../../datos/quimicas';
import {
  CampoNumero, Columna, Fuente, MedidorLineal, Metodo, SemaforoParametro,
} from './quimicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export function PanelSalinidad({ registro, valores }: { registro: R; valores: V }) {
  const laboratorio = aNumero(valores.conductividadDsM);
  const campo = aNumero(valores.ceCampo);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <Columna titulo="Registro de la conductividad eléctrica">
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoNumero
            etiqueta="CE de laboratorio" unidad="dS/m" nombre="conductividadDsM" registro={registro}
            maximo={20} paso="0.01" placeholder="Ej: 0,8"
            rango="Referencia 0–2 dS/m"
          />
          <CampoNumero
            etiqueta="CE portátil" unidad="dS/m" nombre="ceCampo" registro={registro}
            maximo={20} paso="0.01" placeholder="Ej: 0,9"
            ayuda="Orientativa: depende del equipo y la humedad."
          />
        </div>
        <Metodo titulo="Conductímetro">
          <p>Calibra el equipo con solución patrón antes de medir. En laboratorio se usa el extracto de saturación; en campo, la lectura depende de la humedad y del contacto del electrodo.</p>
          <p className="text-xs text-neutral-500">Registra el método y la temperatura si el equipo lo permite.</p>
        </Metodo>
        <p className="mensaje-info">
          El rango validado 0–2 dS/m corresponde a la CE de laboratorio. La lectura portátil se guarda como dato de campo y no reemplaza el reporte.
        </p>
        <Fuente texto={FUENTES_QUIMICAS.salinidad} />
      </Columna>

      <Columna titulo="Lectura de salinidad">
        <MedidorLineal
          titulo="CE de laboratorio"
          valor={laboratorio}
          minimo={0}
          maximo={20}
          optimoMin={0}
          optimoMax={2}
          unidad="dS/m"
          estado={<SemaforoParametro parametro="conductividadDsM" valor={laboratorio} />}
          texto={textoSalinidad(laboratorio, true)}
        />

        <div className="grid gap-1 border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">CE portátil registrada</p>
          <p className="text-lg font-semibold text-humus">
            {campo !== undefined ? `${campo} dS/m` : '—'}
          </p>
          <p className="text-xs leading-relaxed text-neutral-600">{textoSalinidad(campo, false)}</p>
        </div>

        <p className="text-xs leading-relaxed text-neutral-500">
          Una CE alta no identifica por sí sola el tipo de sal. Confirma con el reporte y revisa drenaje, calidad del agua de riego y fertilizantes.
        </p>
      </Columna>
    </div>
  );
}
