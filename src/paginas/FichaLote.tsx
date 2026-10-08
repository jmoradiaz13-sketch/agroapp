import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usoFlujo } from '../estado/usoFlujo';
import { FormularioSuelo } from '../componentes/FormularioSuelo';
import { FichaCampoVSA } from '../componentes/FichaCampoVSA';
import { Boton } from '../componentes/ui/Boton';
import { EncabezadoPagina } from '../componentes/ui/EncabezadoPagina';

// Paso 3: una modalidad visible por vez (No Saturar).
export function FichaLote() {
  const { predioIdentificador } = usoFlujo();
  const [tab, setTab] = useState<'lab' | 'campo'>('lab');
  const id = predioIdentificador ?? 'finca-mirador';

  const tabClase = (activo: boolean) =>
    `boton-campo px-5 py-2.5 text-sm font-semibold rounded-sm transition-colors ${
      activo ? 'bg-[#1b5e20] text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:border-[#1b5e20]'
    }`;

  return (
    <div className="grid gap-4 animacion-entrada">
      <EncabezadoPagina
        kicker="Paso 3 · Análisis de suelos"
        titulo="Análisis de suelos"
        descripcion="Tabla profesional de laboratorio o evaluación visual VSA. Cada guardado crea una nueva versión con fecha: nunca se sobrescribe."
      />
      <div className="bg-white border border-neutral-200 p-3 flex gap-2 flex-wrap" role="tablist" aria-label="Modalidad de análisis">
        <button role="tab" aria-selected={tab === 'lab'} className={tabClase(tab === 'lab')} onClick={() => setTab('lab')}>
          🧪 Análisis lab
        </button>
        <button role="tab" aria-selected={tab === 'campo'} className={tabClase(tab === 'campo')} onClick={() => setTab('campo')}>
          🌱 Campo VSA
        </button>
      </div>
      {tab === 'lab' ? <FormularioSuelo predioIdentificador={id} /> : <FichaCampoVSA predioIdentificador={id} />}
      <Link to="/diagnostico"><Boton>Continuar a diagnóstico →</Boton></Link>
    </div>
  );
}
