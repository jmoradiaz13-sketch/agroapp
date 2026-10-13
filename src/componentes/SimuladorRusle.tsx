import { useMemo, useState } from 'react';
import { estimarRusle } from '../servicios/sig';
import { PRACTICAS_RUSLE, estimarRusleOffline, nivelRiesgoOffline, FUENTE_RUSLE } from '../servicios/diagnostico';
import { Tarjeta } from './ui/Tarjeta';
import { AyudaCampo } from './AyudaCampo';

// Simulador interactivo RUSLE A=R·K·LS·C·P con sliders táctiles y fallback offline.
const COLOR_SEMAFORO: Record<string, string> = {
  verde: '#14736E',
  amarillo: '#f59e0b',
  naranja: '#d97706',
  rojo: '#dc2626',
};

export function SimuladorRusle({ predioIdentificador }: { predioIdentificador: string }) {
  const [pendiente, setPendiente] = useState(12);
  const [cobertura, setCobertura] = useState(60);
  const [longitud, setLongitud] = useState(50);
  const [r, setR] = useState(3000);
  const [k, setK] = useState(0.03);
  const [practica, setPractica] = useState('sin_practicas');
  const [online, setOnline] = useState<{ perdida: number; nivel: string; semaforo: string; manejo: string } | null>(null);
  const [mensaje, setMensaje] = useState('');

  const local = useMemo(() => {
    const perdida = estimarRusleOffline(r, k, pendiente, longitud, cobertura, practica);
    const { nivel, semaforo } = nivelRiesgoOffline(perdida);
    return { perdida, nivel, semaforo };
  }, [r, k, pendiente, longitud, cobertura, practica]);

  const visible = online ?? { perdida: local.perdida, nivel: local.nivel, semaforo: local.semaforo, manejo: 'Estimación local offline (verifica en oficina con DEM).' };
  const color = COLOR_SEMAFORO[visible.semaforo] ?? '#14736E';

  const validarOficina = async () => {
    setMensaje('Consultando oficina…');
    const resp = await estimarRusle({ predio, pendientePct: pendiente, coberturaPct: cobertura, longitudM: longitud, r, k, practica });
    if (!resp.ok || !resp.resultado) {
      setMensaje(resp.error ?? 'Sin conexión: se mantiene la estimación local.');
      setOnline(null);
      return;
    }
    const { nivel_riesgo, semaforo } = resp.resultado as unknown as { nivel_riesgo?: string; semaforo?: string };
    setOnline({
      perdida: resp.resultado.perdida_t_ha_ano,
      nivel: nivel_riesgo ?? resp.resultado.clase,
      semaforo: semaforo ?? 'verde',
      manejo: resp.resultado.manejo,
    });
    setMensaje('');
  };

  // `predio` alias legible para el servicio (evita repetir la prop larga).
  const predio = predioIdentificador;

  return (
    <Tarjeta titulo="Simulador de erosión RUSLE (A = R·K·LS·C·P)">
      <div className="grid gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="etiqueta-campo">Pendiente (%): {pendiente}
            <input type="range" min={0} max={60} value={pendiente} onChange={(e) => setPendiente(Number(e.target.value))} className="w-full boton-campo" aria-label="Pendiente en porcentaje" />
          </label>
          <label className="etiqueta-campo">Cobertura vegetal (%): {cobertura}
            <input type="range" min={0} max={100} value={cobertura} onChange={(e) => setCobertura(Number(e.target.value))} className="w-full boton-campo" aria-label="Cobertura vegetal en porcentaje" />
          </label>
          <label className="etiqueta-campo">Longitud ladera (m): {longitud}
            <input type="range" min={10} max={300} value={longitud} onChange={(e) => setLongitud(Number(e.target.value))} className="w-full boton-campo" aria-label="Longitud de ladera en metros" />
          </label>
          <label className="etiqueta-campo">Práctica de conservación
            <select value={practica} onChange={(e) => setPractica(e.target.value)} className="campo-entrada" aria-label="Práctica de conservación">
              {PRACTICAS_RUSLE.map((p) => <option key={p.id} value={p.id}>{p.etiqueta}</option>)}
            </select>
          </label>
          <label className="etiqueta-campo">R erosividad (Andina ~3000)
            <input type="number" min={100} max={10000} value={r} onChange={(e) => setR(Number(e.target.value))} className="campo-entrada" aria-label="Factor R erosividad" />
          </label>
          <label className="etiqueta-campo">K erodabilidad (franco ~0.03)
            <input type="number" min={0.005} max={0.1} step={0.005} value={k} onChange={(e) => setK(Number(e.target.value))} className="campo-entrada" aria-label="Factor K erodabilidad" />
          </label>
        </div>
        <div className="rounded-xl border p-4 grid gap-1.5" style={{ borderColor: `${color}60`, background: `${color}12` }}>
          <p className="text-sm">
            Pérdida estimada <strong className="numeros text-lg" style={{ color }}>{visible.perdida} t/ha/año</strong>
            {' '}· <span className="font-bold capitalize" style={{ color }}>{visible.nivel}</span>
            {visible.perdida < 5 && <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5"> Guardián erosión &lt;5</span>}
          </p>
          <p className="text-sm text-neutral-600">{visible.manejo}</p>
          <p className="text-[11px] italic text-neutral-500">Fuente: {FUENTE_RUSLE} · Bajo &lt;5 · Moderado 5-15 · Severo 15-50 · Crítico &gt;50</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="boton-campo px-4 py-2 text-sm font-semibold rounded-sm bg-[#059669] text-white hover:bg-emerald-700" onClick={() => void validarOficina()}>
            Validar en oficina (DEM)
          </button>
          {mensaje && <p className="mensaje-info">{mensaje}</p>}
        </div>
        <AyudaCampo
          titulo="¿Por qué importa la erosión?"
          porque="Cada t/ha perdida se lleva materia orgánica y fertilidad que tardó décadas en formarse."
          como="Sube cobertura sobre 70 %, traza curvas a nivel y protege rondas. Re-mide pendiente con DEM en oficina."
          fuente={FUENTE_RUSLE}
        />
      </div>
    </Tarjeta>
  );
}
