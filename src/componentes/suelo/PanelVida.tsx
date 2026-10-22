import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  FUENTES_BIOLOGICAS, OPCIONES_DESCOMPOSICION, OPCIONES_NODULACION, OPCIONES_OLOR,
  aNumero, etiquetaOpcion, textoDescomposicion, textoNodulacion, textoOlor,
} from '../../datos/biologicas';
import {
  Aviso, CampoNumero, Columna, EscalaLombrices, Fuente, LecturaCategorica, Metodo,
  SelloEstado, SelectorCategorico,
} from './biologicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type S = UseFormSetValue<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export function PanelVida({ registro, fijar, valores }: { registro: R; fijar: S; valores: V }) {
  const lombrices = aNumero(valores.lombricesConteo);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <Columna titulo="Registro de campo">
        <div className="flex flex-wrap gap-1.5" aria-label="Estado de los datos de vida">
          <SelloEstado etiqueta="Lombrices" hecho={lombrices !== undefined} />
          <SelloEstado etiqueta="Nodulación" hecho={Boolean(valores.nodulacion)} />
          <SelloEstado etiqueta="Olor" hecho={Boolean(valores.olorSuelo)} />
          <SelloEstado etiqueta="Descomposición" hecho={Boolean(valores.descomposicionMo)} />
        </div>

        <CampoNumero
          etiqueta="Lombrices en el cubo"
          unidad="individuos"
          nombre="lombricesConteo"
          registro={registro}
          paso="1"
          maximo={10000}
          placeholder="Ej: 24"
          rango="Guía: <15 pobre · 22–28 moderado · >35 bueno"
          ayuda="Conteo a simple vista en un cubo de 20×20×20 cm."
        />

        <SelectorCategorico
          etiqueta="Nodulación en leguminosas"
          opciones={OPCIONES_NODULACION}
          valor={valores.nodulacion}
          alCambiar={(v) => fijar('nodulacion', v)}
          ayuda="Revisa raíces de leguminosas si están presentes; los nódulos rosados indican fijación activa."
        />

        <SelectorCategorico
          etiqueta="Olor del suelo"
          opciones={OPCIONES_OLOR}
          valor={valores.olorSuelo}
          alCambiar={(v) => fijar('olorSuelo', v)}
          ayuda="Evalúa el olor al abrir el bloque; la putrefacción sugiere anaerobiosis."
        />

        <SelectorCategorico
          etiqueta="Descomposición de la materia orgánica"
          opciones={OPCIONES_DESCOMPOSICION}
          valor={valores.descomposicionMo}
          alCambiar={(v) => fijar('descomposicionMo', v)}
          ayuda="Observa los residuos y su grado de transformación en el mismo bloque."
        />

        <Metodo titulo="Cubo de 20×20×20 cm (Shepherd, VSA Field Guides, FAO 2008)">
          <p>Excava el cubo, cuenta lombrices e insectos a simple vista y revisa raíces. En el mismo bloque describe el olor y el estado de los residuos.</p>
          <p className="text-xs text-neutral-500">El conteo se guarda como registro; la guía solo clasifica los tramos que se muestran a la derecha.</p>
        </Metodo>
        <Fuente texto={FUENTES_BIOLOGICAS.vida} />
      </Columna>

      <Columna titulo="Lectura de campo">
        <EscalaLombrices valor={lombrices} />
        <div className="grid gap-1">
          <LecturaCategorica
            etiqueta="Nodulación"
            valor={etiquetaOpcion(OPCIONES_NODULACION, valores.nodulacion)}
            texto={textoNodulacion(valores.nodulacion)}
          />
          <LecturaCategorica
            etiqueta="Olor"
            valor={etiquetaOpcion(OPCIONES_OLOR, valores.olorSuelo)}
            texto={textoOlor(valores.olorSuelo)}
          />
          <LecturaCategorica
            etiqueta="Descomposición"
            valor={etiquetaOpcion(OPCIONES_DESCOMPOSICION, valores.descomposicionMo)}
            texto={textoDescomposicion(valores.descomposicionMo)}
          />
        </div>
        <Aviso tono="info">
          Los conteos entre 15–21 y 29–35 no tienen categoría en la referencia de la guía. Se registran sin clasificar para no inventar un umbral.
        </Aviso>
      </Columna>
    </div>
  );
}
