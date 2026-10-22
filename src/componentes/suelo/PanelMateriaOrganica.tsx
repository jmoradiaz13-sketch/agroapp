import type { UseFormRegister } from 'react-hook-form';
import type { FichaSueloFormulario } from '../../esquemas/suelo';
import {
  FUENTES_QUIMICAS, aNumero, textoMateriaOrganica, textoNitrogeno,
} from '../../datos/quimicas';
import {
  CampoNumero, Columna, Fuente, MedidorLineal, Metodo, SemaforoParametro,
} from './quimicas_apoyo';

type R = UseFormRegister<FichaSueloFormulario>;
type V = Partial<FichaSueloFormulario>;

export function PanelMateriaOrganica({ registro, valores }: { registro: R; valores: V }) {
  const mo = aNumero(valores.materiaOrganicaPct);
  const n = aNumero(valores.nitrogenoPct);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <Columna titulo="Registro de materia orgánica y nitrógeno">
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoNumero
            etiqueta="Materia orgánica" unidad="%" nombre="materiaOrganicaPct" registro={registro}
            maximo={20} paso="0.01" placeholder="Ej: 3,2"
            rango="Referencia 2–5 %"
          />
          <CampoNumero
            etiqueta="Nitrógeno total" unidad="%" nombre="nitrogenoPct" registro={registro}
            maximo={2} paso="0.01" placeholder="Ej: 0,18"
            rango="Referencia 0,1–0,3 %"
          />
        </div>
        <Metodo titulo="Walkley-Black y N total (SENA La Granja, práctica 15)">
          <p>La materia orgánica se determina por oxidación con dicromato y titulación. El nitrógeno total se lee junto a la MO por su vínculo directo con la reserva orgánica.</p>
          <p className="text-xs text-neutral-500">Transcribe los valores del reporte; no se recalcula la MO a partir de la titulación.</p>
        </Metodo>
        <p className="mensaje-info">
          Materia orgánica y nitrógeno comparten la reserva de fertilidad, pero se interpretan por separado. Si solo tienes uno, el otro queda como pendiente.
        </p>
        <Fuente texto={FUENTES_QUIMICAS.materia} />
      </Columna>

      <Columna titulo="Lectura de la reserva orgánica">
        <MedidorLineal
          titulo="Materia orgánica"
          valor={mo}
          minimo={0}
          maximo={10}
          optimoMin={2}
          optimoMax={5}
          unidad="%"
          estado={<SemaforoParametro parametro="materiaOrganicaPct" valor={mo} />}
          texto={textoMateriaOrganica(mo)}
        />
        <MedidorLineal
          titulo="Nitrógeno total"
          valor={n}
          minimo={0}
          maximo={0.6}
          optimoMin={0.1}
          optimoMax={0.3}
          unidad="%"
          estado={<SemaforoParametro parametro="nitrogenoPct" valor={n} />}
          texto={textoNitrogeno(n)}
        />
        <p className="text-xs leading-relaxed text-neutral-500">
          La interpretación usa los rangos validados de la guía de calidad del suelo. No se estima la relación C/N porque el reporte no trae carbono total.
        </p>
      </Columna>
    </div>
  );
}
