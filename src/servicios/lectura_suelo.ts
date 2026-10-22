import type { FichaSueloLocal, MonitoreoLocal } from '../base_datos/local';
import type { FichaSueloFormulario } from '../esquemas/suelo';
import {
  VARIABLES_POR_CATEGORIA, estadoVariable, type CategoriaSuelo, type EstadoVariable,
} from '../datos/variables_suelo';
import { RANGOS_VALIDADOS, semaforoPara, TEXTO_SEMAFORO, type Semaforo } from '../datos/rangos';
import {
  CLASES_ES, claseDeEtiqueta, clasificarTextura, calcularAguaDisponible,
  interpretarDensidad, interpretarPorosidad, FUENTE_DENSIDAD, FUENTE_POROSIDAD,
  FUENTE_AGUA, FUENTE_VESS, FUENTE_MUNSELL,
} from '../datos/fisicas';
import {
  derivarBases, textoPh, textoDeltaPh, textoSalinidad, textoMateriaOrganica,
  textoNitrogeno, textoFosforo, FUENTES_QUIMICAS,
} from '../datos/quimicas';
import {
  INDICADORES_VSA, FUENTES_BIOLOGICAS, estadoVsa, puntajesVsa, textoVsa,
  valorVida, valorLaboratorio, textoLombrices, textoCobertura,
} from '../datos/biologicas';

export interface FilaMatrizSuelo {
  id: string;
  categoria: CategoriaSuelo;
  titulo: string;
  estado: EstadoVariable;
  conDato: number;
  totalCampos: number;
  evidencia: string;
  fuente: string;
}

export interface HallazgoValidado {
  etiqueta: string;
  valor: number;
  unidad: string;
  semaforo: Semaforo;
  texto: string;
  fuente: string;
  categoria: CategoriaSuelo;
}

export interface LecturaSuelo {
  filas: FilaMatrizSuelo[];
  hallazgos: HallazgoValidado[];
  conteos: Record<CategoriaSuelo, { registradas: number; total: number }>;
  sintesis: string[];
  faltantes: string[];
}

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const txt = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;

const lista = (partes: (string | undefined)[]): string =>
  partes.filter((p): p is string => !!p).join(' · ');

function textoTextura(v: Partial<FichaSueloFormulario>): string {
  const tacto = txt(v.texturaTacto);
  const claseLab = clasificarTextura(num(v.arenaPct), num(v.limoPct), num(v.arcillaPct));
  const clase = claseLab ?? claseDeEtiqueta(tacto);
  const nombre = clase ? CLASES_ES[clase] : tacto;
  return lista([
    nombre ? `Textura ${nombre.toLowerCase()}` : undefined,
    num(v.arenaPct) !== undefined ? `arena ${v.arenaPct} %` : undefined,
    num(v.limoPct) !== undefined ? `limo ${v.limoPct} %` : undefined,
    num(v.arcillaPct) !== undefined ? `arcilla ${v.arcillaPct} %` : undefined,
  ]) || 'Registro textural disponible.';
}

function textoColor(v: Partial<FichaSueloFormulario>): string {
  const tono = txt(v.munsellH);
  const valor = num(v.munsellV);
  const croma = num(v.munsellC);
  const color = tono && valor !== undefined && croma !== undefined
    ? `Munsell ${tono} ${valor}/${croma}`
    : txt(v.colorMunsell);
  return lista([color, txt(v.colorEstado)]) || 'Color registrado sin carta Munsell completa.';
}

function textoDensidad(v: Partial<FichaSueloFormulario>): string {
  const da = num(v.densidadAparente);
  const clase = claseDeEtiqueta(txt(v.texturaTacto)) ?? clasificarTextura(num(v.arenaPct), num(v.limoPct), num(v.arcillaPct));
  const estadoDa = da !== undefined && clase ? interpretarDensidad(da, clase) : undefined;
  const etiquetaDa: Record<string, string> = { optimo: 'óptima', vigilar: 'a vigilar', restringe: 'restringe raíces' };
  const porosidad = num(v.porosidadPct);
  return lista([
    da !== undefined ? `DA ${da} g/cm³${estadoDa ? ` (${etiquetaDa[estadoDa]})` : ''}` : undefined,
    porosidad !== undefined ? `porosidad ${porosidad} % (${interpretarPorosidad(porosidad).toLowerCase()})` : undefined,
    num(v.densidadReal) !== undefined ? `DR ${v.densidadReal} g/cm³` : undefined,
  ]) || 'Densidad registrada sin textura para interpretar el umbral.';
}

function textoAgua(v: Partial<FichaSueloFormulario>): string {
  const cc = num(v.capacidadCampoPct);
  const pmp = num(v.pmpPct);
  const disponible = calcularAguaDisponible(cc, pmp);
  return disponible !== null
    ? `Agua disponible ${disponible} % (CC ${cc} % − PMP ${pmp} %).`
    : 'CC y PMP registradas; revisa que PMP no supere CC.';
}

function textoEstructura(v: Partial<FichaSueloFormulario>): string {
  return lista([
    num(v.estructuraVess) !== undefined ? `VESS Sq${v.estructuraVess}` : undefined,
    txt(v.compactacion),
    txt(v.infiltracion),
    num(v.profundidadEfectivaCm) !== undefined ? `profundidad efectiva ${v.profundidadEfectivaCm} cm` : undefined,
    txt(v.estructuraDesc),
  ]) || 'Estructura registrada sin VESS.';
}

function textoAcidez(v: Partial<FichaSueloFormulario>): string {
  const ph = num(v.phAgua) ?? num(v.phCampo);
  const delta = num(v.phAgua) !== undefined && num(v.phKcl) !== undefined
    ? Math.round((num(v.phKcl)! - num(v.phAgua)!) * 10) / 10
    : null;
  return lista([
    ph !== undefined ? `pH ${ph}. ${textoPh(ph)}` : undefined,
    delta !== null ? textoDeltaPh(delta) : undefined,
  ]) || 'pH registrado sin lectura de acidez.';
}

function textoBases(v: Partial<FichaSueloFormulario>): string {
  const d = derivarBases(v);
  return lista([
    num(v.calcioCmolKg) !== undefined ? `Ca ${v.calcioCmolKg}` : undefined,
    num(v.magnesioCmolKg) !== undefined ? `Mg ${v.magnesioCmolKg}` : undefined,
    num(v.potasioCmolKg) !== undefined ? `K ${v.potasioCmolKg}` : undefined,
    num(v.sodioCmolKg) !== undefined ? `Na ${v.sodioCmolKg}` : undefined,
    num(v.cicCmolKg) !== undefined ? `CIC ${v.cicCmolKg} cmol/kg` : undefined,
    d.saturacionBasesPct !== null ? `sat. bases ${d.saturacionBasesPct} %` : undefined,
    d.saturacionAlPct !== null ? `sat. Al ${d.saturacionAlPct} %` : undefined,
  ]) || 'Bases registradas sin CIC para calcular saturaciones.';
}

function textoFosforoMicros(v: Partial<FichaSueloFormulario>): string {
  const micros = ['hierroMgKg', 'manganesoMgKg', 'zincMgKg', 'cobreMgKg', 'boroMgKg']
    .filter((k) => num(v[k as keyof FichaSueloFormulario]) !== undefined).length;
  return lista([
    num(v.fosforoMgKg) !== undefined ? textoFosforo(num(v.fosforoMgKg)) : undefined,
    txt(v.metodoFosforo) ? `método ${v.metodoFosforo}` : undefined,
    micros > 0 ? `${micros} microelemento(s) registrados` : undefined,
  ]) || 'Fósforo y micros sin registro.';
}

function evidenciaRegistrada(id: string, v: Partial<FichaSueloFormulario>, vsaTexto?: string): string {
  switch (id) {
    case 'textura': return textoTextura(v);
    case 'color': return textoColor(v);
    case 'densidad': return textoDensidad(v);
    case 'agua': return textoAgua(v);
    case 'estructura': return textoEstructura(v);
    case 'acidez': return textoAcidez(v);
    case 'salinidad': return `CE ${v.conductividadDsM ?? v.ceCampo} dS/m. ${textoSalinidad(num(v.conductividadDsM))}`;
    case 'materia': return lista([
      num(v.materiaOrganicaPct) !== undefined ? textoMateriaOrganica(num(v.materiaOrganicaPct)) : undefined,
      num(v.nitrogenoPct) !== undefined ? textoNitrogeno(num(v.nitrogenoPct)) : undefined,
    ]) || 'MO/N registrados.';
    case 'bases': return textoBases(v);
    case 'fosforo': return textoFosforoMicros(v);
    case 'vida': return lista([valorVida(v), num(v.lombricesConteo) !== undefined ? textoLombrices(num(v.lombricesConteo)) : undefined]);
    case 'vsa': return vsaTexto ?? 'VSA registrada.';
    case 'cobertura': return textoCobertura(num(v.coberturaVegetalPct));
    case 'laboratorio': return valorLaboratorio(v);
    default: return 'Registro disponible.';
  }
}

const FUENTES_FISICAS: Record<string, string> = {
  textura: 'propiedades_fisicas_de_los_suelos.pdf (textura y retención de agua)',
  color: FUENTE_MUNSELL,
  densidad: `${FUENTE_DENSIDAD}; ${FUENTE_POROSIDAD}`,
  agua: FUENTE_AGUA,
  estructura: FUENTE_VESS,
};

function fuenteDe(categoria: CategoriaSuelo, id: string): string {
  if (categoria === 'fisicas') return FUENTES_FISICAS[id] ?? 'Registro descriptivo sin umbral validado.';
  if (categoria === 'quimicas') {
    const rango = RANGOS_VALIDADOS.find((r) => (
      (id === 'materia' && (r.parametro === 'materiaOrganicaPct' || r.parametro === 'nitrogenoPct'))
      || (id === 'bases' && ['calcioCmolKg', 'magnesioCmolKg', 'potasioCmolKg'].includes(r.parametro))
      || (id === 'fosforo' && r.parametro === 'fosforoMgKg')
      || (id === 'salinidad' && r.parametro === 'conductividadDsM')
    ));
    return rango?.fuente ?? FUENTES_QUIMICAS[id as keyof typeof FUENTES_QUIMICAS] ?? 'Registro descriptivo sin umbral validado.';
  }
  return FUENTES_BIOLOGICAS[id as keyof typeof FUENTES_BIOLOGICAS] ?? 'Registro descriptivo sin umbral validado.';
}

export function construirLecturaSuelo(ficha: FichaSueloLocal, monitoreo?: MonitoreoLocal): LecturaSuelo {
  const puntajes: Record<string, number> = {};
  for (const id of INDICADORES_VSA) {
    const valor = monitoreo?.indicadores[id];
    if (typeof valor === 'number') puntajes[id] = valor;
  }
  const resumenVsa = puntajesVsa(puntajes);
  // FichaSueloLocal guarda texto libre; la lectura usa el mismo contrato del formulario.
  const valores = ficha as unknown as Partial<FichaSueloFormulario>;

  const filas: FilaMatrizSuelo[] = (['fisicas', 'quimicas', 'biologicas'] as const).flatMap((categoria) =>
    VARIABLES_POR_CATEGORIA[categoria].map((def) => {
      if (def.id === 'vsa') {
        const estado = estadoVsa(resumenVsa);
        return {
          id: def.id, categoria, titulo: def.titulo, estado,
          conDato: resumenVsa.tocados, totalCampos: INDICADORES_VSA.length,
          evidencia: estado === 'pendiente' ? def.sinDatosQueDecir : textoVsa(resumenVsa),
          fuente: FUENTES_BIOLOGICAS.vsa,
        };
      }
      const { estado, conDato } = estadoVariable(def, valores);
      const totalCampos = def.campos.length;
      const evidencia = estado === 'pendiente'
        ? def.sinDatosQueDecir
        : estado === 'en_progreso'
          ? `${conDato} de ${totalCampos} datos. ${def.paraConfirmar}`
          : evidenciaRegistrada(def.id, valores);
      return {
        id: def.id, categoria, titulo: def.titulo, estado,
        conDato, totalCampos, evidencia, fuente: fuenteDe(categoria, def.id),
      };
    })
  );

  const hallazgos: HallazgoValidado[] = RANGOS_VALIDADOS.flatMap((rango) => {
    const valor = num(ficha[rango.parametro as keyof FichaSueloLocal]);
    if (valor === undefined) return [];
    const semaforo = semaforoPara(rango, valor);
    return [{
      etiqueta: rango.etiqueta, valor, unidad: rango.unidad, semaforo,
      texto: TEXTO_SEMAFORO[semaforo], fuente: rango.fuente, categoria: 'quimicas',
    }];
  });

  const conteos = (['fisicas', 'quimicas', 'biologicas'] as const).reduce((acc, categoria) => {
    const delGrupo = filas.filter((f) => f.categoria === categoria);
    acc[categoria] = {
      registradas: delGrupo.filter((f) => f.estado === 'registrada').length,
      total: delGrupo.length,
    };
    return acc;
  }, {} as Record<CategoriaSuelo, { registradas: number; total: number }>);

  const totalRegistradas = filas.filter((f) => f.estado === 'registrada').length;
  const faltantes = filas
    .filter((f) => f.estado !== 'registrada')
    .map((f) => `${f.titulo} (${f.estado === 'en_progreso' ? 'en progreso' : 'pendiente'})`);

  const sintesis: string[] = [
    `Se registraron ${totalRegistradas} de ${filas.length} variables: `
    + `${conteos.fisicas.registradas}/${conteos.fisicas.total} físicas, `
    + `${conteos.quimicas.registradas}/${conteos.quimicas.total} químicas y `
    + `${conteos.biologicas.registradas}/${conteos.biologicas.total} biológicas.`,
  ];

  if (hallazgos.length > 0) {
    sintesis.push(
      'Parámetros con rango validado: '
      + hallazgos.map((h) => `${h.etiqueta} ${h.valor} ${h.unidad} (${h.texto.toLowerCase()})`).join('; ')
      + '. Los demás datos quedan como evidencia descriptiva sin umbral en el catálogo.'
    );
  } else {
    sintesis.push('No hay parámetros con rango validado registrados. La lectura es descriptiva y no emite un semáforo químico.');
  }

  const fisicas = filas.filter((f) => f.categoria === 'fisicas' && f.estado === 'registrada').map((f) => f.titulo);
  const quimicas = filas.filter((f) => f.categoria === 'quimicas' && f.estado === 'registrada').map((f) => f.titulo);
  const biologicas = filas.filter((f) => f.categoria === 'biologicas' && f.estado === 'registrada').map((f) => f.titulo);
  sintesis.push(`Física: ${fisicas.length ? fisicas.join(', ') : 'sin variables registradas'}. Química: ${quimicas.length ? quimicas.join(', ') : 'sin variables registradas'}. Biológica: ${biologicas.length ? biologicas.join(', ') : 'sin variables registradas'}.`);

  return { filas, hallazgos, conteos, sintesis, faltantes };
}
