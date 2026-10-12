import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';
import { GUIAS, type GuiaPaso } from '../datos/guias';

const FILTROS: { id: GuiaPaso['paso'] | 'todas'; titulo: string }[] = [
  { id: 'todas', titulo: 'Todas' },
  { id: 'general', titulo: 'Muestreo' },
  { id: 'fisicas', titulo: 'Físicas' },
  { id: 'quimicas', titulo: 'Químicas' },
  { id: 'biologicas', titulo: 'Biológicas' },
  { id: 'sig', titulo: 'SIG' },
  { id: 'riego', titulo: 'Riego' },
];

// Cada guía abre su escena real: la biblioteca es paisaje, no callejón.
const ESCENA_POR_PASO: Record<GuiaPaso['paso'], { ruta: string; etiqueta: string }> = {
  general: { ruta: '/predios', etiqueta: 'Abrir escena Predios →' },
  fisicas: { ruta: '/ficha', etiqueta: 'Abrir escena Suelos →' },
  quimicas: { ruta: '/ficha', etiqueta: 'Abrir escena Suelos →' },
  biologicas: { ruta: '/ficha', etiqueta: 'Abrir escena Suelos →' },
  sig: { ruta: '/sig', etiqueta: 'Abrir escena SIG →' },
  riego: { ruta: '/simulador', etiqueta: 'Abrir escena Simulador →' },
};

// Biblioteca "Aprende en campo": guías paso a paso con fuente, 100 % offline.
// Cada tarjeta abre su escena real: la biblioteca es paisaje, no callejón.
export function Biblioteca() {
  const navegar = useNavigate();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['id']>('todas');
  const [abierta, setAbierta] = useState<string | null>(null);
  const visibles = filtro === 'todas' ? GUIAS : GUIAS.filter((g) => g.paso === filtro);

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Aprende en campo"
        titulo="Biblioteca de guías"
        descripcion="Paso a paso ilustrado para cada labor, con su fuente. Descargada en tu dispositivo: funciona sin internet."
        imagen="/imagenes/1.jpg"
      />
      <div className="scroll-sutil flex flex-nowrap gap-1.5 overflow-x-auto" role="tablist" aria-label="Filtrar guías">
        {FILTROS.map((f) => (
          <button
            key={f.id} type="button" role="tab" aria-selected={filtro === f.id}
            onClick={() => setFiltro(f.id)}
            className={`boton-campo shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
              filtro === f.id ? 'bg-emerald-600 text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-emerald-600'
            }`}
          >
            {f.titulo}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 items-start">
        {visibles.map((g) => (
          <article key={g.titulo} className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setAbierta((a) => (a === g.titulo ? null : g.titulo))}
              aria-expanded={abierta === g.titulo}
              className="w-full text-left"
            >
              <span className="relative block h-28 overflow-hidden">
                <img src={g.imagen} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
                <span className="absolute bottom-2 left-3 right-3 text-white font-semibold text-sm leading-snug">{g.titulo}</span>
              </span>
            </button>
            {abierta === g.titulo && (
              <div className="p-4 grid gap-2 animacion-entrada">
                <span className="sr-only">{g.imagenAlt}</span>
                <ol className="grid gap-1.5">
                  {g.pasos.map((p, i) => (
                    <li key={p} className="text-sm text-neutral-700 flex gap-2 items-start">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold grid place-items-center shrink-0 mt-0.5" aria-hidden>{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
                <p className="text-[11px] italic text-neutral-500">Fuente: {g.fuente}</p>
                <button
                  type="button"
                  onClick={() => navegar(ESCENA_POR_PASO[g.paso].ruta)}
                  className="boton-campo justify-self-start text-xs font-bold rounded-full px-4 py-2 transition-colors"
                  style={{ background: 'var(--marca)', color: 'var(--marca-texto)' }}
                >
                  {ESCENA_POR_PASO[g.paso].etiqueta}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
