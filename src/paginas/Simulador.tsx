import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { Boton, BotonSecundario } from '../componentes/ui/Boton';
import { BancoEspecies } from '../componentes/simulador/BancoEspecies';
import { Comparador } from '../componentes/simulador/Comparador';
import { TarjetaRiego } from '../componentes/simulador/TarjetaRiego';
import { baseDatos, type FichaSueloLocal, type LoteLocal, type PredioLocal } from '../base_datos/local';
import {
  guardarEscenario, pedirCompatibilidades, pedirCostos, pedirEscenarios, pedirRotaciones,
  type Compatibilidad, type Costo, type Escenario, type Rotacion, type Sitio,
} from '../servicios/simulador';

type Paso = 'zona' | 'banco' | 'escenarios' | 'comparar' | 'plan';

const PASOS: { id: Paso; titulo: string }[] = [
  { id: 'zona', titulo: 'Zona de estudio' },
  { id: 'banco', titulo: 'Banco' },
  { id: 'escenarios', titulo: 'Escenarios' },
  { id: 'comparar', titulo: 'Comparar' },
  { id: 'plan', titulo: 'Plan' },
];

// Simulador: del diagnóstico del sitio a sistemas de producción y
// restauración (A/B/C). Reglas citadas, supuestos editables, offline.
export function Simulador() {
  const [paso, setPaso] = useState<Paso>('zona');
  const [predios, setPredios] = useState<PredioLocal[]>([]);
  const [lotes, setLotes] = useState<LoteLocal[]>([]);
  const [predioId, setPredioId] = useState('');
  const [loteNombre, setLoteNombre] = useState('');
  const [ficha, setFicha] = useState<FichaSueloLocal | null>(null);
  const [especies, setEspecies] = useState<import('../base_datos/local').EspecieLocal[]>([]);
  const [compat, setCompat] = useState<Compatibilidad[] | null>(null);
  const [escenarios, setEscenarios] = useState<Escenario[] | null>(null);
  const [elegido, setElegido] = useState<'A' | 'B' | 'C'>('C');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [areaHa, setAreaHa] = useState(1);
  const [costos, setCostos] = useState<Record<string, Costo>>({});
  const [rotaciones, setRotaciones] = useState<Rotacion[]>([]);
  const [rotacionId, setRotacionId] = useState('');

  const cargarEspecies = async () => setEspecies(await baseDatos.especies.toArray());

  useEffect(() => {
    void baseDatos.predios.toArray().then(setPredios);
    void cargarEspecies();
    void pedirRotaciones().then((rs) => {
      setRotaciones(rs);
      setRotacionId(rs[0]?.id ?? '');
    });
  }, []);
  useEffect(() => {
    if (!predioId) { setLotes([]); return; }
    void baseDatos.lotes.where('predioIdentificador').equals(predioId).toArray().then(setLotes);
    void baseDatos.predios.where('identificador').equals(predioId).first()
      .then((p) => { if (p?.areaTotalHa) setAreaHa(p.areaTotalHa); });
    void baseDatos.fichasSuelo.where('predioIdentificador').equals(predioId).toArray()
      .then((fs) => setFicha(fs.sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null));
  }, [predioId]);

  const lote = lotes.find((l) => l.nombre === loteNombre);
  const sitio: Sitio = {
    ph: ficha?.phAgua,
    mo_pct: ficha?.materiaOrganicaPct,
    textura: ficha?.texturaTacto,
    pendiente_pct: lote?.pendientePct,
    zona_vida: lote?.zonaVida,
    cobertura_pct: ficha?.coberturaVegetalPct ?? 40,
  };

  const generar = async () => {
    if (sitio.pendiente_pct === undefined) {
      setMensaje('La zona necesita pendiente: calcúlala en /sig o registra la del lote.');
      return;
    }
    if (especies.length === 0) { setMensaje('Siembra el banco base primero.'); return; }
    setCargando(true);
    const comp = await pedirCompatibilidades(especies, sitio);
    if (!comp.ok) { setMensaje(comp.error ?? 'Error'); setCargando(false); return; }
    setCompat(comp.resultados ?? []);
    const esc = await pedirEscenarios(sitio, especies);
    setCargando(false);
    if (!esc.ok) { setMensaje(esc.error ?? 'Error'); return; }
    setEscenarios(esc.escenarios ?? []);
    setElegido('C');
    void pedirCostos(['A', 'B', 'C'], areaHa).then(setCostos);
    setMensaje(`${comp.resultados?.filter((c) => c.apta).length ?? 0} especies aptas. Elige y compara.`);
    setPaso('comparar');
  };

  const guardar = async (e: Escenario) => {
    setMensaje(await guardarEscenario(predioId || 'sin-predio', loteNombre || undefined, e));
  };

  const elegidoObj = escenarios?.find((e) => e.tipo === elegido);

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Simulador · Producción y restauración"
        titulo="Simula tu sistema"
        descripcion="Parte del diagnóstico de tu zona y compara escenarios productivos y de restauración con reglas citadas."
        imagen="/imagenes/4.jpg"
      />

      <div className="scroll-sutil flex flex-nowrap gap-1.5 overflow-x-auto p-3 border border-neutral-200 bg-white rounded-sm" role="tablist" aria-label="Pasos del simulador">
        {PASOS.map((p) => (
          <button
            key={p.id} type="button" role="tab" aria-selected={paso === p.id}
            onClick={() => setPaso(p.id)}
            className={`boton-campo shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
              paso === p.id ? 'bg-emerald-600 text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-emerald-600'
            }`}
          >
            {p.titulo}
          </button>
        ))}
      </div>
      {mensaje && <p className="mensaje-ok" role="status">{mensaje}</p>}

      {paso === 'zona' && (
        <Tarjeta titulo="Zona de estudio (del diagnóstico)">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="etiqueta-campo">Predio
              <select className="campo-entrada" value={predioId} onChange={(e) => { setPredioId(e.target.value); setLoteNombre(''); }}>
                <option value="">— Elige un predio —</option>
                {predios.map((p) => <option key={p.identificador} value={p.identificador}>{p.nombre}</option>)}
              </select>
            </label>
            <label className="etiqueta-campo">Lote
              <select className="campo-entrada" value={loteNombre} onChange={(e) => setLoteNombre(e.target.value)} disabled={!predioId}>
                <option value="">— Toda la unidad —</option>
                {lotes.map((l) => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
              </select>
            </label>
          </div>
          <dl className="grid gap-1.5 text-sm border border-neutral-200 p-4">
            <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Suelo</dt><dd className="font-medium">{ficha ? `pH ${ficha.phAgua ?? '?'} · MO ${ficha.materiaOrganicaPct ?? '?'} % · ${ficha.texturaTacto ?? 'sin textura'}` : 'Sin ficha: los vacíos entran como supuestos editables'}</dd></div>
            <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Relieve</dt><dd className="font-medium">{lote?.pendientePct !== undefined ? `${lote.pendientePct} % · erosión ${lote.erosion ?? '?'}` : 'Sin pendiente: calcúlala en /sig'}</dd></div>
            <div className="flex gap-2"><dt className="text-neutral-500 w-28 shrink-0">Cobertura</dt><dd className="font-medium">{sitio.cobertura_pct} % {ficha?.coberturaVegetalPct === undefined && '(supuesto)'}</dd></div>
          </dl>
          <label className="etiqueta-campo">Área a simular (ha)
            <input className="campo-entrada" type="number" min={0.1} step={0.1} value={areaHa} onChange={(e) => setAreaHa(Number(e.target.value) || 1)} />
          </label>
          <div><Boton onClick={() => setPaso('banco')}>Continuar al banco</Boton></div>
        </Tarjeta>
      )}

      {paso === 'banco' && <BancoEspecies especies={especies} alCambiar={() => void cargarEspecies()} />}

      {paso === 'escenarios' && (
        <Tarjeta titulo="Compatibilidad y escenarios">
          <p className="text-sm text-neutral-600">Evalúa cada especie contra tu zona y genera A productivo, B restauración y C integrado.</p>
          <div><Boton onClick={() => void generar()} disabled={cargando}>{cargando ? 'Simulando…' : 'Generar escenarios'}</Boton></div>
          {compat && (
            <ul className="grid gap-1.5">
              {compat.map((c) => (
                <li key={c.especie} className="border border-neutral-200 px-3 py-2 text-sm flex flex-wrap items-center gap-2">
                  <strong className="font-semibold">{c.especie}</strong>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${c.apta ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {c.apta ? `${c.puntaje} apta` : 'descartada'}
                  </span>
                  <span className="text-[11px] text-neutral-500">{c.motivos.find((m) => !m.cumple)?.regla ?? c.motivos[0]?.regla} · {c.motivos[0]?.cita}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      )}

      {paso === 'comparar' && (
        escenarios ? (
          <Comparador escenarios={escenarios} elegido={elegido} alElegir={setElegido} alGuardar={(e) => void guardar(e)} costos={costos} />
        ) : (
          <p className="mensaje-info">Genera los escenarios primero.</p>
        )
      )}

      {paso === 'plan' && (
        elegidoObj ? (
          <>
            <Tarjeta titulo={`Plan · ${elegidoObj.nombre}`}>
            <p className="text-sm text-neutral-600">{elegidoObj.rotacion}</p>
            <label className="etiqueta-campo">Rotación precargada
              <select value={rotacionId} onChange={(e) => setRotacionId(e.target.value)} className="campo-entrada">
                {rotaciones.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </label>
            {rotaciones.find((r) => r.id === rotacionId) && (
              <ol className="grid gap-1.5">
                {rotaciones.find((r) => r.id === rotacionId)!.secuencia.map((s, i) => (
                  <li key={s} className="border border-neutral-200 px-3 py-2 text-sm flex gap-2 items-start">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold grid place-items-center shrink-0" aria-hidden>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            )}
            <p className="text-[11px] italic text-neutral-500">
              Fuente: {rotaciones.find((r) => r.id === rotacionId)?.fuente} · {rotaciones.find((r) => r.id === rotacionId)?.aporte}
            </p>
            <ul className="grid gap-1.5 text-sm">
              {[
                `Sembrar: ${elegidoObj.componentes.join(', ') || 'define componentes'}`,
                `Conservar: ${elegidoObj.conservacion_pct} % en parches y corredores`,
                `RUSLE ${elegidoObj.rusle_antes_t_ha_ano} → ${elegidoObj.rusle_despues_t_ha_ano} t/ha/año`,
                'Muestrear zonas débiles NDVI con VSA + foto',
              ].map((t) => (
                <li key={t} className="border border-neutral-200 px-3 py-2 flex gap-2 items-start">
                  <span className="w-5 h-5 rounded-sm border-2 border-emerald-600 shrink-0 mt-0.5" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 flex-wrap">
              <Link to="/diseno"><BotonSecundario>Abrir en diseño espacial →</BotonSecundario></Link>
              <Link to="/informe"><BotonSecundario>Llevar al informe →</BotonSecundario></Link>
            </div>
          </Tarjeta>
          <TarjetaRiego />
          </>
        ) : (
          <p className="mensaje-info">Elige un escenario en Comparar.</p>
        )
      )}
    </div>
  );
}
