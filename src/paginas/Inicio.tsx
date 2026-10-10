import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usoPredio } from '../estado/usoPredio';
import { etiquetaCache } from '../base_datos/local';

const TARJETAS = [
  {
    titulo: 'Determina las características de tu suelo',
    subtitulo: 'Responde el análisis de suelos y conoce la fertilidad y salud de tu tierra.',
    ruta: '/ficha',
    imagen: '/imagenes/3.jpg',
    alt: 'Manos sosteniendo tierra fértil',
  },
  {
    titulo: 'Diseño de sistemas de producción agroecológica',
    subtitulo: 'Combina cultivos, sombrío y coberturas para una finca productiva y resiliente.',
    ruta: '/diseno',
    imagen: '/imagenes/4.jpg',
    alt: 'Cultivos agroecológicos en campo',
  },
  {
    titulo: 'SIG para restauración ecológica',
    subtitulo: 'Usa mapas y datos espaciales para planificar la recuperación de suelos y coberturas.',
    ruta: '/diagnostico',
    imagen: '/imagenes/5.jpg',
    alt: 'Paisaje en restauración ecológica',
  },
];

const CATEGORIAS = [
  { titulo: 'Predios', ruta: '/predios' },
  { titulo: 'Lotes', ruta: '/lote' },
  { titulo: 'Análisis de suelos', ruta: '/ficha' },
  { titulo: 'Diseño', ruta: '/diseno' },
  { titulo: 'Diagnóstico', ruta: '/diagnostico' },
  { titulo: 'Informe', ruta: '/informe' },
  { titulo: 'Monitoreo', ruta: '/lote' },
  { titulo: 'VSA campo', ruta: '/ficha' },
];

const HERRAMIENTAS = [
  { titulo: 'Análisis de suelos profesional', descripcion: 'Tabla completa de laboratorio: registre valores y verifique rangos validados.', ruta: '/ficha', etiqueta: 'Herramienta' },
  { titulo: 'Diseños guardados', descripcion: 'Consulta las versiones de tus diseños agroecológicos.', ruta: '/diseno', etiqueta: 'Simulador' },
  { titulo: 'Historial de fichas', descripcion: 'Consulta la serie temporal de análisis por lote.', ruta: '/ficha', etiqueta: 'Hemeroteca' },
];

const DESTACADOS: { titulo: string; enlaces: { texto: string; ruta: string }[] }[] = [
  {
    titulo: 'Destacados suelos',
    enlaces: [
      { texto: 'Registrar ficha de laboratorio', ruta: '/ficha' },
      { texto: 'Evaluación visual VSA en campo', ruta: '/ficha' },
      { texto: 'Materia orgánica y pH: rangos', ruta: '/ficha' },
      { texto: 'Cationes en cmol/kg', ruta: '/ficha' },
      { texto: 'Fósforo y micronutrientes mg/kg', ruta: '/ficha' },
    ],
  },
  {
    titulo: 'Destacados lotes',
    enlaces: [
      { texto: 'Delimitar lote con GPS', ruta: '/lote' },
      { texto: 'Caracterización del lote', ruta: '/lote' },
      { texto: 'Capas IGAC por polígono', ruta: '/lote' },
      { texto: 'Pendiente y zonas homogéneas', ruta: '/diagnostico' },
      { texto: 'Monitoreo por lote', ruta: '/lote' },
    ],
  },
  {
    titulo: 'Destacados informe',
    enlaces: [
      { texto: 'Diagnóstico ponderado', ruta: '/diagnostico' },
      { texto: 'Estrategias agroecológicas', ruta: '/diagnostico' },
      { texto: 'Generar informe del predio', ruta: '/informe' },
      { texto: 'Diseño de agroecosistemas', ruta: '/diseno' },
      { texto: 'Especies de cacao Orinoquía', ruta: '/diseno' },
    ],
  },
];

export function PaginaInicio() {
  const navegar = useNavigate();
  const { fechaCache } = usoPredio();
  const [busqueda, setBusqueda] = useState('');

  const irEmpezar = () => {
    navegar('/ficha');
  };

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    navegar(busqueda.trim() ? `/predios?buscar=${encodeURIComponent(busqueda.trim())}` : '/predios');
  };

  return (
    <div className="grid gap-8 animacion-entrada">
      {/* Buscador central estilo referencia */}
      <form onSubmit={buscar} className="flex justify-center" role="search" aria-label="Buscar en AgroForestapp">
        <div className="flex items-center bg-[#1b5e20] rounded-sm overflow-hidden shadow-sm w-56">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="search"
            aria-label="Buscar predio, lote o tema"
            className="bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none w-full font-medium"
          />
          <button type="submit" aria-label="Buscar" className="boton-campo px-3 text-white text-lg font-semibold">
            ⌕
          </button>
        </div>
      </form>

      {/* 3 tarjetas negras superiores */}
      <section className="grid md:grid-cols-3 gap-3" aria-label="Accesos destacados">
        {TARJETAS.map((t, i) => (
          i === 0 ? (
            <div
              key={t.titulo}
              className="group text-left relative overflow-hidden bg-[#1c1c1c] text-white p-5 min-h-[190px] grid content-start gap-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.55)]"
            >
              <img
                src={t.imagen}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
            <span className="absolute inset-0 bg-black/35" aria-hidden="true" />
            <span className="relative text-[15px] font-semibold leading-snug drop-shadow">{t.titulo}</span>
            <span className="relative text-[11px] leading-relaxed text-white/85">{t.subtitulo}</span>
              <button
                onClick={irEmpezar}
                className="boton-campo relative mt-2 w-fit bg-[#1b5e20] text-white text-xs font-semibold px-4 py-2 rounded-sm border border-white/25 hover:bg-[#124116] transition-colors"
              >
                Empezar
              </button>
            </div>
          ) : (
          <button
            key={t.titulo}
            onClick={() => navegar(t.ruta)}
            className="group text-left relative overflow-hidden bg-[#1c1c1c] text-white p-5 min-h-[190px] grid content-start gap-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.55)]"
          >
            <img
              src={t.imagen}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
            <span className="absolute inset-0 bg-black/35" aria-hidden="true" />
            <span className="relative text-[15px] font-semibold leading-snug drop-shadow">{t.titulo}</span>
            <span className="relative text-[11px] leading-relaxed text-white/85">{t.subtitulo}</span>
          </button>
          )
        ))}
      </section>

      {/* Destacado + sidebar categorías */}
      <section className="grid lg:grid-cols-3 gap-3">
        <article className="lg:col-span-2 relative overflow-hidden bg-[#141414] min-h-[380px] grid items-end">
          <img
            src="/imagenes/1.jpg"
            alt="Plántula emergiendo de un suelo oscuro y fértil"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" aria-hidden />
          <div className="relative p-6 grid gap-2 text-white">
            <span className="text-xl" aria-hidden>→</span>
            <h2 className="font-display text-2xl sm:text-3xl font-medium leading-tight max-w-xl">
              Gestión de la finca: cómo el diagnóstico por lotes ayuda a integrar nuevos manejos
            </h2>
            <p className="text-sm text-white/75 max-w-xl">
              Dibujo offline con GPS, ficha VSA inmutable y recomendaciones con fuente registrada.
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <button onClick={irEmpezar} className="boton-campo bg-[#1b5e20] text-white font-semibold px-6 py-2.5 rounded-sm text-sm border border-white/25 hover:bg-[#124116] transition-colors">
                Empezar
              </button>
              <button onClick={() => navegar('/predios')} className="boton-campo bg-white/15 text-white font-semibold px-6 py-2.5 rounded-sm text-sm border border-white/40 hover:bg-white/25">
                Ver mis predios
              </button>
            </div>
          </div>
        </article>

        <aside className="bg-[#1c1c1c] text-white p-5 pt-4 grid content-start gap-0" aria-label="Categorías principales">
          <h3 className="text-[13px] font-medium tracking-wide text-white/90 border-b border-white/15 pb-3 text-center">
            Categorías principales
          </h3>
          {CATEGORIAS.map((c) => (
            <button
              key={c.titulo}
              onClick={() => navegar(c.ruta)}
              className="boton-campo text-[13px] font-medium tracking-wide text-white/85 hover:text-white hover:bg-white/10 hover:shadow-[inset_0_0_14px_rgba(255,255,255,0.14)] rounded-sm border-b border-white/10 pb-2 pt-1 transition-all text-center"
            >
              {c.titulo}
            </button>
          ))}
        </aside>
      </section>

      {/* Herramientas */}
      <section aria-label="Herramientas">
        <div className="grid sm:grid-cols-3 gap-3">
          {HERRAMIENTAS.map((h) => (
            <button
              key={h.titulo}
              onClick={() => navegar(h.ruta)}
              className="text-left bg-[#1b5e20] text-white p-5 grid gap-1.5 hover:bg-[#124116] transition-colors"
            >
              <span className="text-[11px] font-semibold tracking-widest text-white/60">{h.etiqueta}</span>
              <span className="text-base font-semibold">{h.titulo}</span>
              <span className="text-xs text-white/70 leading-relaxed">{h.descripcion}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Destacados por tema */}
      <section className="grid md:grid-cols-3 gap-6" aria-label="Destacados por tema">
        {DESTACADOS.map((col) => (
          <div key={col.titulo}>
            <h4 className="text-sm font-medium tracking-wide text-[#141414] border-b-2 border-[#1b5e20] pb-2 mb-2">{col.titulo}</h4>
            <ul className="grid">
              {col.enlaces.map((e) => (
                <li key={e.texto}>
                  <button
                    onClick={() => navegar(e.ruta)}
                    className="w-full text-left text-[13px] text-neutral-600 hover:text-[#1b5e20] hover:underline underline-offset-4 py-1.5 border-b border-neutral-100 transition-colors"
                  >
                    {e.texto}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Modo campo: caché y sincronización */}
      <section className="bg-[#141414] text-white p-6 grid sm:grid-cols-[1fr_auto] items-center gap-4" aria-label="Estado de sincronización">
        <div className="grid gap-1">
          <h4 className="text-base font-medium tracking-wide">Modo campo · trabaja sin conexión</h4>
          <p className="text-xs text-white/60">
            {fechaCache ? etiquetaCache(fechaCache) : 'Caché local - actualizado el (sin sincronizar)'} • Máx 200 MB por predio
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={irEmpezar} className="boton-campo bg-[#1b5e20] text-white text-sm font-semibold px-6 py-2.5 rounded-sm hover:bg-[#124116] transition-colors">
            Empezar
          </button>
          <button onClick={() => navegar('/lote')} className="boton-campo bg-transparent text-white text-sm font-semibold px-6 py-2.5 rounded-sm border border-white/40 hover:bg-white/10 transition-colors">
            Ir a lotes
          </button>
        </div>
      </section>
    </div>
  );
}
