import { useEffect, useState } from 'react';
import { baseDatos, type PredioLocal, type LoteLocal, type UsoSueloDiseno, type ComponenteDiseno } from '../base_datos/local';
import { Boton, BotonSecundario } from '../componentes/ui/Boton';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';

type Paso = 'origen' | 'espacial' | 'componentes' | 'resumen';

const PASOS: { id: Paso; titulo: string }[] = [
  { id: 'origen', titulo: 'Punto de partida' },
  { id: 'espacial', titulo: 'Diseño espacial' },
  { id: 'componentes', titulo: 'Componentes' },
  { id: 'resumen', titulo: 'Resumen' },
];

const USOS = [
  { clave: 'Cultivos', color: '#059669' },
  { clave: 'SAF / agroforestería', color: '#2d6a4f' },
  { clave: 'Pecuario', color: '#b08968' },
  { clave: 'Conservación / parches', color: '#555555' },
  { clave: 'Corredores / cercas vivas', color: '#86a860' },
  { clave: 'Infraestructura', color: '#d4d4d4' },
];

const ROLES = [
  'Fijadora de nitrógeno', 'Sombrío', 'Cobertura viva', 'Control biológico',
  'Abono verde', 'Rompevientos', 'Forraje', 'Frutal / ingreso', 'Maderable',
];

const TIPOS = ['SAF', 'Silvopastoril', 'Policultivo', 'Corredor biológico', 'Mixto'];

const NIVELES = [
  { valor: 1, texto: 'Nivel 1 · Eficiencia en insumos' },
  { valor: 2, texto: 'Nivel 2 · Sustitución de insumos' },
  { valor: 3, texto: 'Nivel 3 · Rediseño del agroecosistema' },
  { valor: 4, texto: 'Nivel 4 · Valores y cultura' },
];

// Simulador de diseño agroecológico de unidades de producción.
// Doble entrada: terreno caracterizado (predio/lote) o desde cero con mínimos.
export function PaginaDiseno() {
  const [paso, setPaso] = useState<Paso>('origen');
  const [modo, setModo] = useState<'existente' | 'cero'>('existente');
  const [predios, setPredios] = useState<PredioLocal[]>([]);
  const [lotes, setLotes] = useState<LoteLocal[]>([]);
  const [predioId, setPredioId] = useState('');
  const [loteNombre, setLoteNombre] = useState('');
  const [nombreUnidad, setNombreUnidad] = useState('');
  const [area, setArea] = useState('');
  const [zonaClima, setZonaClima] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [tipo, setTipo] = useState('SAF');
  const [nivel, setNivel] = useState(3);
  const [usos, setUsos] = useState<Record<string, number>>({ 'Cultivos': 50, 'SAF / agroforestería': 30, 'Conservación / parches': 20 });
  const [componentes, setComponentes] = useState<ComponenteDiseno[]>([{ rol: 'Sombrío', especie: '', detalle: '' }]);
  const [rotacion, setRotacion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState<{ version: number; fecha: string }[]>([]);

  useEffect(() => { void baseDatos.predios.toArray().then(setPredios); }, []);
  useEffect(() => {
    if (!predioId) { setLotes([]); return; }
    void baseDatos.lotes.where('predioIdentificador').equals(predioId).toArray().then(setLotes);
  }, [predioId]);

  const usarPredio = (identificador: string) => {
    setPredioId(identificador);
    setLoteNombre('');
    const p = predios.find((x) => x.identificador === identificador);
    if (p) {
      setNombreUnidad(p.nombre);
      setArea(p.areaTotalHa !== undefined ? String(p.areaTotalHa) : '');
      setZonaClima([p.municipio, p.departamento].filter(Boolean).join(', '));
    }
  };

  const usarLote = (nombre: string) => {
    setLoteNombre(nombre);
    const l = lotes.find((x) => x.nombre === nombre);
    if (l) {
      if (l.areaHa !== undefined) setArea(String(l.areaHa));
      setNombreUnidad(`${l.nombre}`);
    }
  };

  const total = Object.values(usos).reduce((a, b) => a + (b || 0), 0);
  const areaNum = Number(area) || 0;
  const conservacion = (usos['Conservación / parches'] || 0) + (usos['Corredores / cercas vivas'] || 0);

  const agregarComponente = () => setComponentes([...componentes, { rol: ROLES[0], especie: '', detalle: '' }]);
  const quitarComponente = (i: number) => setComponentes(componentes.filter((_, j) => j !== i));
  const editarComponente = (i: number, campo: keyof ComponenteDiseno, valor: string) =>
    setComponentes(componentes.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)));

  const cargarHistorial = async () => {
    const todos = await baseDatos.disenos
      .where('predioIdentificador').equals(predioId || 'sin-predio')
      .toArray();
    setHistorial(todos.map((d) => ({ version: d.version, fecha: d.fecha })).sort((a, b) => b.version - a.version));
  };
  useEffect(() => { void cargarHistorial(); }, [predioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = async () => {
    if (!nombreUnidad.trim()) { setMensaje('Ponle un nombre a la unidad de producción.'); return; }
    if (Math.round(total) !== 100) { setMensaje(`Los usos del suelo deben sumar 100 % (van en ${Math.round(total)} %).`); return; }
    const clave = predioId || 'sin-predio';
    const existentes = await baseDatos.disenos.where('predioIdentificador').equals(clave).count();
    const usosSuelo: UsoSueloDiseno[] = Object.entries(usos)
      .filter(([, v]) => (v || 0) > 0)
      .map(([uso, porcentaje]) => ({ uso, porcentaje }));
    await baseDatos.disenos.add({
      predioIdentificador: clave,
      loteNombre: loteNombre || undefined,
      nombreUnidad: nombreUnidad.trim(),
      fecha: new Date().toISOString().slice(0, 10),
      version: existentes + 1,
      areaTotalHa: areaNum || undefined,
      zonaClima: zonaClima.trim() || undefined,
      objetivo: objetivo.trim() || undefined,
      tipoDiseno: tipo,
      nivelTransicion: nivel,
      usosSuelo,
      componentes: componentes.filter((c) => c.rol.trim() !== ''),
      rotacionAsociacion: rotacion.trim() || undefined,
      referenciaBibliografica: referencia.trim() || undefined,
      sincronizada: false,
    });
    setMensaje(`Diseño v${existentes + 1} guardado offline para "${nombreUnidad.trim()}".`);
    await cargarHistorial();
  };

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Simulador · Diseño agroecológico"
        titulo="Diseña tu agroecosistema"
        descripcion="Parte de un terreno caracterizado o simula desde cero con datos mínimos. Mueve los usos del suelo y ve el resultado en vivo."
      />

      <div className="scroll-sutil flex flex-nowrap gap-1.5 overflow-x-auto p-3 border border-neutral-200 bg-white" role="tablist" aria-label="Pasos del simulador">
        {PASOS.map((p) => (
          <button
            key={p.id} type="button" role="tab" aria-selected={paso === p.id}
            onClick={() => setPaso(p.id)}
            className={`boton-campo shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
              paso === p.id ? 'bg-[#059669] text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-[#059669]'
            }`}
          >
            {p.titulo}
          </button>
        ))}
      </div>

      {paso === 'origen' && (
        <section className="bg-white border border-neutral-200 p-5 grid gap-4">
          <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Origen de datos">
            <button type="button" onClick={() => setModo('existente')} className={`boton-campo px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${modo === 'existente' ? 'bg-selva text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-selva'}`}>
              Terreno caracterizado
            </button>
            <button type="button" onClick={() => { setModo('cero'); setPredioId(''); setLoteNombre(''); }} className={`boton-campo px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${modo === 'cero' ? 'bg-selva text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-selva'}`}>
              Empezar de cero
            </button>
          </div>

          {modo === 'existente' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="etiqueta-campo">Predio
                <select className="campo-entrada" value={predioId} onChange={(e) => usarPredio(e.target.value)}>
                  <option value="">— Elige un predio —</option>
                  {predios.map((p) => <option key={p.identificador} value={p.identificador}>{p.nombre}</option>)}
                </select>
              </label>
              <label className="etiqueta-campo">Lote (opcional)
                <select className="campo-entrada" value={loteNombre} onChange={(e) => usarLote(e.target.value)} disabled={!predioId}>
                  <option value="">— Toda la unidad —</option>
                  {lotes.map((l) => <option key={l.id} value={l.nombre}>{l.nombre}{l.areaHa !== undefined ? ` (${l.areaHa} ha)` : ''}</option>)}
                </select>
              </label>
              {predios.length === 0 && <p className="mensaje-info sm:col-span-2">Sin predios registrados. Agrega uno en Predios o empieza de cero.</p>}
            </div>
          ) : (
            <p className="mensaje-info">Simulación con datos mínimos: nombra la unidad e indica su área. Los lotes y análisis se conectan después.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="etiqueta-campo">Nombre de la unidad *
              <input className="campo-entrada" value={nombreUnidad} onChange={(e) => setNombreUnidad(e.target.value)} placeholder="Ej: Finca La Esperanza · Lote 1" />
            </label>
            <label className="etiqueta-campo">Área total (ha) *
              <input className="campo-entrada" type="number" step="0.01" min="0" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej: 5" />
            </label>
            <label className="etiqueta-campo sm:col-span-2">Zona / clima
              <input className="campo-entrada" value={zonaClima} onChange={(e) => setZonaClima(e.target.value)} placeholder="Ej: Orinoquía, cálido húmedo" />
            </label>
          </div>
          <div><Boton onClick={() => setPaso('espacial')}>Continuar al diseño espacial →</Boton></div>
        </section>
      )}

      {paso === 'espacial' && (
        <section className="bg-white border border-neutral-200 p-5 grid gap-4">
          <div>
            <h3 className="text-lg font-semibold text-humus">Reparte el área: {areaNum ? `${areaNum} ha` : 'indica el área en el paso anterior'}</h3>
            <p className="text-xs text-neutral-500">Mueve los deslizadores. La suma debe dar 100 %.</p>
          </div>
          <div className="h-6 w-full flex overflow-hidden rounded-sm border border-neutral-200" aria-hidden>
            {USOS.map((u) => {
              const v = usos[u.clave] || 0;
              return v > 0 ? <span key={u.clave} style={{ width: `${v}%`, background: u.color }} title={`${u.clave} ${v} %`} /> : null;
            })}
          </div>
          {USOS.map((u) => {
            const v = usos[u.clave] || 0;
            const ha = areaNum ? ` · ${((areaNum * v) / 100).toFixed(2)} ha` : '';
            return (
              <label key={u.clave} className="grid grid-cols-[1fr_4rem_3.5rem] items-center gap-2">
                <span className="text-sm text-neutral-700 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: u.color }} aria-hidden />
                  {u.clave}
                </span>
                <input
                  type="range" min="0" max="100" step="1" value={v} aria-label={`${u.clave} porcentaje`}
                  onChange={(e) => setUsos({ ...usos, [u.clave]: Number(e.target.value) })}
                  className="w-full accent-[#059669]"
                />
                <span className="text-sm font-semibold text-humus text-right">{v} %{ha}</span>
              </label>
            );
          })}
          <p className={Math.round(total) === 100 ? 'mensaje-ok' : 'mensaje-error'}>
            Total: {Math.round(total)} % {Math.round(total) === 100 ? '· reparto válido' : '· debe sumar 100 %'}
          </p>
          {conservacion < 10 && (
            <p className="mensaje-info">Conservación + corredores suman {conservacion} %. Se sugiere ≥ 10 % para biodiversidad (Trivellone et al., 2014).</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <BotonSecundario onClick={() => setPaso('origen')}>← Volver</BotonSecundario>
            <Boton onClick={() => setPaso('componentes')}>Continuar a componentes →</Boton>
          </div>
        </section>
      )}

      {paso === 'componentes' && (
        <section className="bg-white border border-neutral-200 p-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="etiqueta-campo">Objetivo del diseño
              <input className="campo-entrada" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Ej: cacao bajo sombrío + seguridad alimentaria" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="etiqueta-campo">Tipo
                <select className="campo-entrada" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="etiqueta-campo">Transición
                <select className="campo-entrada" value={nivel} onChange={(e) => setNivel(Number(e.target.value))}>
                  {NIVELES.map((n) => <option key={n.valor} value={n.valor}>Nivel {n.valor}</option>)}
                </select>
              </label>
            </div>
          </div>
          <p className="text-xs text-neutral-500">{NIVELES.find((n) => n.valor === nivel)?.texto}</p>
          <label className="etiqueta-campo">Rotación / asociación en el tiempo
            <textarea className="campo-entrada min-h-[88px]" value={rotacion} onChange={(e) => setRotacion(e.target.value)} placeholder="Ej: año 1 maíz + fríjol, año 2 cacao joven con plátano…" />
          </label>
          <div className="grid gap-2">
            <h4 className="text-sm font-semibold text-humus">Componentes por rol funcional</h4>
            {componentes.map((c, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[11rem_1fr_auto] border border-neutral-200 p-3">
                <label className="etiqueta-campo">Rol
                  <select className="campo-entrada" value={c.rol} onChange={(e) => editarComponente(i, 'rol', e.target.value)}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label className="etiqueta-campo">Especie (demostrativa)
                  <input className="campo-entrada" value={c.especie} onChange={(e) => editarComponente(i, 'especie', e.target.value)} placeholder="Ej: guamo" />
                </label>
                <button type="button" onClick={() => quitarComponente(i)} disabled={componentes.length === 1} className="boton-campo self-end px-3 text-neutral-400 hover:text-red-700 disabled:opacity-30" aria-label="Quitar componente">✕</button>
                <label className="etiqueta-campo sm:col-span-2">Detalle
                  <input className="campo-entrada" value={c.detalle ?? ''} onChange={(e) => editarComponente(i, 'detalle', e.target.value)} placeholder="Ej: cerco cada 3 m" />
                </label>
              </div>
            ))}
            <div><BotonSecundario onClick={agregarComponente}>＋ Agregar componente</BotonSecundario></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <BotonSecundario onClick={() => setPaso('espacial')}>← Volver</BotonSecundario>
            <Boton onClick={() => setPaso('resumen')}>Ver resumen →</Boton>
          </div>
        </section>
      )}

      {paso === 'resumen' && (
        <section className="bg-white border border-neutral-200 p-5 grid gap-4">
          <h3 className="text-lg font-semibold text-humus">Resumen del diseño</h3>
          <dl className="grid gap-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-neutral-500 w-32 shrink-0">Unidad</dt><dd className="font-medium">{nombreUnidad || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-neutral-500 w-32 shrink-0">Área</dt><dd>{areaNum ? `${areaNum} ha` : '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-neutral-500 w-32 shrink-0">Tipo · Nivel</dt><dd>{tipo} · Nivel {nivel}</dd></div>
            {objetivo && <div className="flex gap-2"><dt className="text-neutral-500 w-32 shrink-0">Objetivo</dt><dd>{objetivo}</dd></div>}
          </dl>
          <div className="h-6 w-full flex overflow-hidden rounded-sm border border-neutral-200" aria-hidden>
            {USOS.map((u) => {
              const v = usos[u.clave] || 0;
              return v > 0 ? <span key={u.clave} style={{ width: `${v}%`, background: u.color }} /> : null;
            })}
          </div>
          <ul className="grid gap-1 text-sm">
            {Object.entries(usos).filter(([, v]) => (v || 0) > 0).map(([uso, v]) => (
              <li key={uso} className="flex justify-between border-b border-neutral-100 py-1">
                <span>{uso}</span>
                <span className="font-medium">{v} %{areaNum ? ` · ${((areaNum * v) / 100).toFixed(2)} ha` : ''}</span>
              </li>
            ))}
          </ul>
          {componentes.filter((c) => c.rol.trim() !== '').length > 0 && (
            <ul className="grid gap-1 text-sm">
              {componentes.filter((c) => c.rol.trim() !== '').map((c, i) => (
                <li key={i} className="border border-neutral-200 px-3 py-1.5">
                  <strong className="font-semibold">{c.rol}</strong>{c.especie ? ` · ${c.especie}` : ''}{c.detalle ? ` — ${c.detalle}` : ''}
                </li>
              ))}
            </ul>
          )}
          <label className="etiqueta-campo">Referencia (opcional, se cuadra después)
            <input className="campo-entrada" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej: guía de campo, manual SAF, reporte técnico" />
          </label>
          {mensaje && <p className={mensaje.startsWith('Diseño v') ? 'mensaje-ok' : 'mensaje-error'}>{mensaje}</p>}
          <div className="flex gap-2 flex-wrap">
            <BotonSecundario onClick={() => setPaso('componentes')}>← Volver</BotonSecundario>
            <Boton onClick={() => void guardar()}>Guardar diseño (offline)</Boton>
          </div>
          {historial.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-humus mb-1">Versiones guardadas ({historial.length})</h4>
              <ol className="border border-neutral-200 divide-y divide-neutral-100">
                {historial.map((h) => (
                  <li key={h.version} className="px-3 py-1.5 text-sm">
                    <span className="font-semibold text-emerald-700">v{h.version}</span> <span className="text-neutral-500">· {h.fecha}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
