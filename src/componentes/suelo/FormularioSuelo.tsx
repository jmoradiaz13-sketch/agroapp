import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaFichaSuelo, type FichaSueloFormulario } from '../../esquemas/suelo';
import { baseDatos } from '../../base_datos/local';
import { Boton } from '../ui/Boton';

// Tabla-formulario profesional de análisis de suelos (reporte estándar Colombia).
// Solo los 7 parámetros del catálogo validado tienen interpretación en el
// diagnóstico; el resto se registra como serie temporal sin interpretar.
// Umbrales: aplicacion/datos/referencias.py (trazables a src/*.pdf).
const CON_RANGO = new Set([
  'materiaOrganicaPct', 'fosforoMgKg', 'potasioCmolKg', 'calcioCmolKg',
  'magnesioCmolKg', 'conductividadDsM', 'nitrogenoPct',
]);

type Campo = { clave: keyof FichaSueloFormulario; etiqueta: string; unidad: string; paso: string; max: number };
type Grupo = { titulo: string; campos: Campo[] };

const GRUPOS: Grupo[] = [
  {
    titulo: 'Identificación de la muestra',
    campos: [
      { clave: 'profundidadCm', etiqueta: 'Profundidad de muestreo', unidad: 'cm', paso: '1', max: 200 },
    ],
  },
  {
    titulo: 'Acidez del suelo',
    campos: [
      { clave: 'phAgua', etiqueta: 'pH en agua (1:1)', unidad: '—', paso: '0.01', max: 14 },
      { clave: 'phKcl', etiqueta: 'pH en KCl', unidad: '—', paso: '0.01', max: 14 },
    ],
  },
  {
    titulo: 'Materia orgánica y nitrógeno',
    campos: [
      { clave: 'materiaOrganicaPct', etiqueta: 'Materia orgánica', unidad: '%', paso: '0.01', max: 20 },
      { clave: 'nitrogenoPct', etiqueta: 'Nitrógeno total', unidad: '%', paso: '0.01', max: 2 },
    ],
  },
  {
    titulo: 'Bases intercambiables y CIC',
    campos: [
      { clave: 'calcioCmolKg', etiqueta: 'Calcio', unidad: 'cmol/kg', paso: '0.01', max: 30 },
      { clave: 'magnesioCmolKg', etiqueta: 'Magnesio', unidad: 'cmol/kg', paso: '0.01', max: 15 },
      { clave: 'potasioCmolKg', etiqueta: 'Potasio', unidad: 'cmol/kg', paso: '0.01', max: 5 },
      { clave: 'sodioCmolKg', etiqueta: 'Sodio', unidad: 'cmol/kg', paso: '0.01', max: 10 },
      { clave: 'cicCmolKg', etiqueta: 'CIC', unidad: 'cmol/kg', paso: '0.1', max: 60 },
    ],
  },
  {
    titulo: 'Fósforo y sales',
    campos: [
      { clave: 'fosforoMgKg', etiqueta: 'Fósforo disponible', unidad: 'mg/kg', paso: '0.1', max: 500 },
      { clave: 'conductividadDsM', etiqueta: 'Conductividad eléctrica', unidad: 'dS/m', paso: '0.01', max: 20 },
    ],
  },
  {
    titulo: 'Micronutrientes',
    campos: [
      { clave: 'hierroMgKg', etiqueta: 'Hierro', unidad: 'mg/kg', paso: '0.1', max: 2000 },
      { clave: 'manganesoMgKg', etiqueta: 'Manganeso', unidad: 'mg/kg', paso: '0.1', max: 2000 },
      { clave: 'zincMgKg', etiqueta: 'Zinc', unidad: 'mg/kg', paso: '0.1', max: 2000 },
      { clave: 'cobreMgKg', etiqueta: 'Cobre', unidad: 'mg/kg', paso: '0.1', max: 2000 },
      { clave: 'boroMgKg', etiqueta: 'Boro', unidad: 'mg/kg', paso: '0.1', max: 2000 },
    ],
  },
  {
    titulo: 'Textura (% granulometría)',
    campos: [
      { clave: 'arenaPct', etiqueta: 'Arena', unidad: '%', paso: '0.1', max: 100 },
      { clave: 'limoPct', etiqueta: 'Limo', unidad: '%', paso: '0.1', max: 100 },
      { clave: 'arcillaPct', etiqueta: 'Arcilla', unidad: '%', paso: '0.1', max: 100 },
    ],
  },
];

// El técnico decide: el sistema sugiere, el técnico puede editar/rechazar.
// Nueva ficha = nueva versión (inmutabilidad: nunca se sobrescribe).
export function FormularioSuelo({ predioIdentificador }: { predioIdentificador: string }) {
  const [mensaje, setMensaje] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<FichaSueloFormulario>({
    resolver: zodResolver(esquemaFichaSuelo),
    defaultValues: { predioIdentificador, fecha: new Date().toISOString().slice(0, 10) }
  });

  const alGuardar = async (datos: FichaSueloFormulario) => {
    // Trazabilidad mínima (§2.1): si la fecha quedó vacía, se repone a hoy.
    const fecha = datos.fecha || new Date().toISOString().slice(0, 10);
    const existentes = await baseDatos.fichasSuelo.where('predioIdentificador').equals(datos.predioIdentificador).count();
    await baseDatos.fichasSuelo.add({
      ...datos,
      fecha,
      version: existentes + 1,
      sincronizada: false
    });
    setMensaje(`Análisis v${existentes + 1} guardado localmente (offline). Los 7 parámetros con rango validado se interpretan en Diagnóstico; el resto queda registrado sin interpretar. Fuente: ${datos.referenciaBibliografica}`);
  };

  return (
    <form onSubmit={handleSubmit(alGuardar)} className="bg-white border border-neutral-200 p-5 grid gap-5">
      <div className="border-b border-neutral-200 pb-3 grid gap-1 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="text-lg font-medium text-humus">Análisis de suelos — tabla profesional</h2>
          <p className="text-xs text-neutral-500">Serie temporal • Complete solo los valores del reporte de laboratorio</p>
        </div>
        <label className="etiqueta-campo">Fecha muestra
          <input className="campo-entrada" type="date" {...register('fecha')} />
        </label>
      </div>

      <label className="etiqueta-campo max-w-md">Laboratorio / observador
        <input className="campo-entrada" placeholder="Ej: Laboratorio IGAC Tibaitatá" {...register('laboratorio')} />
      </label>

      {GRUPOS.map((g) => (
        <fieldset key={g.titulo} className="grid gap-2">
          <legend className="text-xs font-medium text-humus bg-neutral-100 px-2 py-1 w-full">
            {g.titulo}
          </legend>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-neutral-400 border-b border-neutral-200">
                  <th className="py-1.5 pr-2 font-medium">Variable</th>
                  <th className="py-1.5 pr-2 font-medium w-36">Valor</th>
                  <th className="py-1.5 pr-2 font-medium w-24">Unidad</th>
                  <th className="py-1.5 font-medium w-44">Interpretación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {g.campos.map((c) => (
                  <tr key={c.clave}>
                    <td className="py-1.5 pr-2 font-medium text-neutral-700">{c.etiqueta}</td>
                    <td className="py-1.5 pr-2">
                      <input
                        className="campo-entrada !min-h-[44px] !py-1.5"
                        type="number" step={c.paso} min="0"
                        aria-label={`${c.etiqueta} en ${c.unidad}`}
                        {...register(c.clave as 'profundidadCm', { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })}
                      />
                    </td>
                    <td className="py-1.5 pr-2 text-neutral-500 text-xs">{c.unidad}</td>
                    <td className="py-1.5">
                      {CON_RANGO.has(c.clave as string) ? (
                        <span className="text-[11px] font-medium text-emerald-700">✓ Con rango validado</span>
                      ) : (
                        <span className="text-[11px] font-medium text-neutral-400">Solo registro</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>
      ))}

      <label className="etiqueta-campo">Referencia (opcional)
        <input
          className="campo-entrada"
          placeholder="Ej: guia_para_la_evaluacion_de_la_calidad_y_salud_del_suelo.pdf p.12-18"
          {...register('referenciaBibliografica')}
        />
      </label>
      {errors.referenciaBibliografica && <p className="mensaje-error">{errors.referenciaBibliografica.message}</p>}
      {mensaje && <p className="mensaje-ok">{mensaje}</p>}
      <div><Boton type="submit">Guardar análisis (offline)</Boton></div>
    </form>
  );
}
