import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { baseDatos, type PredioLocal } from '../base_datos/local';
import { sembrarDemo } from '../servicios/semilla_demo';
import { usoFlujo } from '../estado/usoFlujo';
import { Boton, BotonSecundario } from '../componentes/ui/Boton';
import { Tarjeta } from '../componentes/ui/Tarjeta';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';

const POLIGONO_INICIAL: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[-74.06, 4.64], [-74.04, 4.64], [-74.04, 4.66], [-74.06, 4.66], [-74.06, 4.64]]],
};

// Paso 1: lista, búsqueda, alta y ficha del predio navegable a lotes.
export function PaginaPredios() {
  const [predios, setPredios] = useState<PredioLocal[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState('');
  const [propietario, setPropietario] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [area, setArea] = useState('');
  const { fijarPredio } = usoFlujo();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const filtro = (params.get('buscar') ?? '').toLowerCase();

  const cargar = async () => setPredios(await baseDatos.predios.toArray());

  useEffect(() => { void cargar(); }, []);
  useEffect(() => {
    if (params.get('accion') === 'nuevo') setMostrarFormulario(true);
  }, [params]);

  const guardarPredio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setMensaje('El nombre del predio es obligatorio.'); return; }
    const base = nombre.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'predio';
    const identificador = `${base}-${Date.now().toString(36)}`;
    await baseDatos.predios.add({
      identificador,
      nombre: nombre.trim(),
      propietario: propietario.trim() || undefined,
      municipio: municipio.trim() || undefined,
      departamento: departamento.trim() || undefined,
      areaTotalHa: area ? Number(area) : undefined,
      geometria: POLIGONO_INICIAL,
      fechaActualizacion: new Date().toISOString(),
      tamanoCacheBytes: 0,
      estadoSincronizacion: 'pendiente',
    });
    setMensaje(`Predio "${nombre.trim()}" creado offline. Dibuja sus lotes en el mapa.`);
    setNombre(''); setPropietario(''); setMunicipio(''); setDepartamento(''); setArea('');
    setMostrarFormulario(false);
    await cargar();
  };

  const visibles = filtro
    ? predios.filter((p) =>
        [p.nombre, p.propietario ?? '', p.municipio ?? '', p.departamento ?? '']
          .join(' ').toLowerCase().includes(filtro)
      )
    : predios;

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Paso 1 · Gestión del predio"
        titulo="Mis predios"
        descripcion="Crea predios offline, filtra por nombre o municipio y abre sus lotes. Los datos se sincronizan en oficina."
        acciones={
          <>
            <button onClick={() => setMostrarFormulario((v) => !v)} className="boton-campo bg-[#1b5e20] text-white text-sm font-semibold px-5 py-2.5 rounded-sm hover:bg-[#124116] transition-colors">
              {mostrarFormulario ? 'Cerrar' : '＋ Agregar predio'}
            </button>
            <BotonSecundario onClick={async () => { setMensaje(await sembrarDemo()); await cargar(); }} className="!bg-transparent !text-white !border-white/40 hover:!bg-white/10">
              Sembrar demo
            </BotonSecundario>
          </>
        }
      />

      {mensaje && <p className="mensaje-ok">{mensaje}</p>}

      {mostrarFormulario && (
        <Tarjeta titulo="Nuevo predio (offline)">
          <form onSubmit={(e) => void guardarPredio(e)} className="grid gap-3 sm:grid-cols-2">
            <label className="etiqueta-campo">Nombre del predio *
              <input className="campo-entrada" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Finca El Mirador" />
            </label>
            <label className="etiqueta-campo">Propietario
              <input className="campo-entrada" value={propietario} onChange={(e) => setPropietario(e.target.value)} />
            </label>
            <label className="etiqueta-campo">Municipio
              <input className="campo-entrada" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
            </label>
            <label className="etiqueta-campo">Departamento
              <input className="campo-entrada" value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
            </label>
            <label className="etiqueta-campo">Área total (ha)
              <input className="campo-entrada" type="number" step="0.01" min="0" value={area} onChange={(e) => setArea(e.target.value)} />
            </label>
            <div className="sm:col-span-2">
              <Boton type="submit">Guardar predio offline</Boton>
            </div>
          </form>
        </Tarjeta>
      )}

      <Tarjeta titulo={`Predios (${visibles.length})${filtro ? ` — filtro: "${params.get('buscar')}"` : ''}`}>
        {visibles.length === 0 && (
          <p className="text-sm text-neutral-500">
            {predios.length === 0 ? 'Sin predios. Agrega el primero o siembra la demo Andina.' : 'Sin resultados para ese filtro.'}
          </p>
        )}
        <div className="grid gap-3">
          {visibles.map((p) => (
            <article key={p.identificador} className="border border-neutral-200 p-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h3 className="font-semibold text-[#141414]">{p.nombre}</h3>
                <p className="text-sm text-neutral-500">
                  {p.propietario ?? '—'} • {p.municipio ?? '?'} {p.departamento ?? ''} • {p.areaTotalHa ?? '?'} ha
                </p>
                <p className="text-[11px] font-medium text-neutral-400 tracking-wide">
                  Sync: {p.estadoSincronizacion ?? 'pendiente'}
                </p>
              </div>
              <Boton onClick={() => { fijarPredio(p.identificador); navegar('/lote'); }}>
                Abrir → Lote
              </Boton>
            </article>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}
