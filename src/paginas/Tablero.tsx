import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { usoPredio } from '../estado/usoPredio';
import { baseDatos, etiquetaCache, type FichaSueloLocal, type LoteLocal, type PredioLocal } from '../base_datos/local';
import { calcularMadurez, type Madurez } from '../servicios/madurez';
import { ESCENAS } from '../datos/escenas';
import { Icono } from '../componentes/Iconos';
import { MedidorRadial } from '../componentes/MedidorRadial';
import { Boton, BotonSecundario } from '../componentes/ui/Boton';

// Tablero (choice board): puerta de entrada a las escenas. Cada tarjeta es un
// punto de entrada con foto, promesa, modo de conectividad y estado vivo
// desde Dexie. Exploración libre: el usuario elige su recorrido.
const VIDEOS: { titulo: string; detalle: string }[] = [
  { titulo: 'Recorre tu finca en video', detalle: 'Recorre los lotes narrando lo observado (requiere red).' },
  { titulo: 'VSA paso a paso en campo', detalle: 'Demostración de la evaluación visual (requiere red).' },
];

export function PaginaTablero() {
  const navegar = useNavigate();
  const { fechaCache } = usoPredio();
  const { predioIdentificador, fijarPredio } = usoFlujo();
  const [predios, setPredios] = useState<PredioLocal[]>([]);
  const [lotes, setLotes] = useState<LoteLocal[]>([]);
  const [ficha, setFicha] = useState<FichaSueloLocal | null>(null);
  const [conteoPlan, setConteoPlan] = useState({ escenarios: 0, disenos: 0 });
  const [madurez, setMadurez] = useState<Madurez | null>(null);

  useEffect(() => {
    void baseDatos.predios.toArray().then((ps) => {
      setPredios(ps);
      if (!predioIdentificador && ps[0]) fijarPredio(ps[0].identificador);
    });
    void calcularMadurez().then(setMadurez);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!predioIdentificador) return;
    void baseDatos.lotes.where('predioIdentificador').equals(predioIdentificador).toArray().then(setLotes);
    void baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).toArray()
      .then((fs) => setFicha(fs.sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null));
    void Promise.all([
      baseDatos.escenarios.where('predioIdentificador').equals(predioIdentificador).count(),
      baseDatos.disenos.where('predioIdentificador').equals(predioIdentificador).count(),
    ]).then(([escenarios, disenos]) => setConteoPlan({ escenarios, disenos }));
  }, [predioIdentificador]);

  const predio = predios.find((p) => p.identificador === predioIdentificador) ?? predios[0];
  const areaLotes = lotes.reduce((a, l) => a + (l.areaHa ?? 0), 0);

  // Estado vivo por escena (Dexie): la tarjeta muestra dónde estás.
  const estadoPorEscena: Record<string, string> = {
    predios: predios.length === 0 ? 'Crea el primero' : `${predios.length} predio(s) · activo: ${predio?.nombre ?? '—'}`,
    lote: lotes.length === 0 ? 'Dibuja el primero en el mapa' : `${lotes.length} lotes · ${areaLotes.toFixed(1)} ha`,
    ficha: ficha ? `v${ficha.version} · pH ${ficha.phAgua ?? '?'} · MO ${ficha.materiaOrganicaPct ?? '?'} %` : 'Sin ficha registrada',
    diagnostico: ficha ? `Ficha v${ficha.version} lista para interpretar` : 'Registra una ficha primero',
    sig: lotes.length === 0 ? 'Delimita lotes para cruzar capas' : `${lotes.length} lotes para enriquecer`,
    simulador: `${conteoPlan.escenarios} escenarios · ${conteoPlan.disenos} diseños`,
    diseno: `${conteoPlan.disenos} diseños guardados`,
    informe: ficha ? 'Listo para generar con la última ficha' : 'Requiere ficha y diagnóstico',
    biblioteca: 'Guías offline + videos online',
  };

  return (
    <div className="grid gap-5 animacion-entrada">
      {/* Hero editorial: declaración + recorrido */}
      <section className="grid gap-5 py-6 sm:py-10" aria-label="Planificación de fincas">
        <p className="kicker">Surcos · Elige tu recorrido</p>
        <h1 className="font-display font-medium leading-[1.02]" style={{ color: 'var(--texto)', fontSize: 'clamp(2.6rem, 7vw, 5.2rem)', maxWidth: '16ch' }}>
          Planificación de fincas
        </h1>
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '52ch' }}>
          Suelos vivos, territorio y plan agroforestal paso a paso — en campo sin conexión o en oficina con datos.
          {predio ? ` Hoy trabajas en ${predio.nombre}.` : ' Crea tu primer predio para empezar.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <Boton onClick={() => navegar(predio ? '/lote' : '/predios')}>Comenzar</Boton>
          <BotonSecundario onClick={() => navegar('/ingreso')}>Ingresar</BotonSecundario>
        </div>
      </section>

      {/* Tablero de escenas: cada tarjeta lleva su color-espacio */}
      <section aria-label="Tablero de escenas">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 pt-2">
          {ESCENAS.map((e, i) => (
            <button
              key={e.id}
              onClick={() => navegar(e.ruta)}
              className="group text-left grid content-start transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--sup)', border: '1px solid var(--borde)', boxShadow: 'var(--sombra-suave)' }}
            >
              <span className="flex items-center justify-between px-5 h-20" style={{ background: e.color }} aria-hidden>
                <span className="font-display text-4xl font-medium" style={{ color: e.sobre }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ color: e.sobre, opacity: 0.9 }}><Icono id={e.icono} /></span>
              </span>
              <span className="grid gap-1.5 content-start p-5">
                <span className="flex items-center justify-between gap-2">
                  <span className="mono-micro" style={{ color: 'var(--acento)' }}>{e.etapa}</span>
                  <span className="mono-micro rounded-full px-2 py-0.5" style={{ background: 'var(--sup-2)', color: 'var(--muted)', border: '1px solid var(--borde)' }}>
                    {e.insignia}
                  </span>
                </span>
                <span className="fila-menu font-display text-2xl font-medium leading-tight" style={{ color: 'var(--texto)' }}>{e.titulo}</span>
                <span className="text-sm leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '42ch' }}>{e.descripcion}</span>
                <span className="text-[12px] font-semibold inline-flex items-center gap-1.5" style={{ color: 'var(--texto)' }}>
                  {estadoPorEscena[e.id] ?? ''} <span aria-hidden className="fila-flecha">→</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Videos (solo online): patrón bloque de video Oath — portada + duración */}
      <section className="grid gap-3 pt-2" aria-label="Videos">
        <h2 className="kicker">Videos · requieren conexión</h2>
        <div className="grid gap-0" style={{ borderTop: '1px solid var(--borde)' }}>
          {VIDEOS.map((v, i) => (
            <article key={v.titulo} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4" style={{ borderBottom: '1px solid var(--borde)' }}>
              <span className="font-display text-sm" style={{ color: 'var(--faint)' }} aria-hidden>{String(i + 1).padStart(2, '0')}</span>
              <span className="grid gap-0.5 min-w-0">
                <span className="font-display text-xl font-medium truncate" style={{ color: 'var(--texto)' }}>{v.titulo}</span>
                <span className="text-xs truncate" style={{ color: 'var(--muted)' }}>{v.detalle}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="mono-micro px-2 py-0.5" style={{ background: '#F6B23D', color: '#0B2F31' }}>ONLINE · PRÓXIMO</span>
                <span className="w-11 h-11 rounded-full grid place-items-center boton-campo" style={{ border: '1px solid var(--texto)', color: 'var(--texto)' }} aria-hidden>▶</span>
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* Madurez + caché */}
      <section className="glass rounded-2xl p-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center" aria-label="Madurez y sincronización">
        {madurez ? <MedidorRadial madurez={madurez} /> : <p className="text-sm" style={{ color: 'var(--muted)' }}>Calculando madurez…</p>}
        <div className="grid gap-1 content-start">
          <h2 className="text-base font-semibold" style={{ color: 'var(--texto)' }}>Modo campo · trabaja sin conexión</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'} • Máx 200 MB por predio
          </p>
        </div>
      </section>
    </div>
  );
}
