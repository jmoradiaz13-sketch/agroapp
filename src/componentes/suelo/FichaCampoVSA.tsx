import { useState } from 'react';
import { baseDatos } from '../../base_datos/local';
import { Boton } from '../ui/Boton';

// MVP 5 campo: VSA simplificado 6 indicadores 0-2, índice 0-100 offline.
const INDICADORES = ['estructura', 'porosidad', 'color', 'lombrices', 'cobertura', 'erosion_visible'];

export function FichaCampoVSA({ predioIdentificador }: { predioIdentificador: string }) {
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [mensaje, setMensaje] = useState('');

  const guardar = async () => {
    const vals = INDICADORES.map((i) => puntajes[i] ?? 0);
    const indice = Math.round((vals.reduce((a, b) => a + b, 0) / (INDICADORES.length * 2)) * 100);
    const existentes = await baseDatos.fichasSuelo.where('predioIdentificador').equals(predioIdentificador).count();
    await baseDatos.fichasSuelo.add({
      predioIdentificador, fecha: new Date().toISOString().slice(0, 10), version: existentes + 1,
      materiaOrganicaPct: undefined, referenciaBibliografica: 'guia_para_la_evaluacion_visual_de_la_calidad_del_suelo.pdf (VSA)',
      sincronizada: false
    });
    await baseDatos.monitoreos.add({
      loteNombre: 'general', fecha: new Date().toISOString().slice(0, 10),
      indicadores: { vsa_indice: indice, ...puntajes }, observaciones: `VSA campo índice ${indice}/100`,
      sincronizada: false
    });
    setMensaje(`VSA guardado offline. Índice calidad: ${indice}/100 (serie temporal v${existentes + 1}).`);
  };

  return (
    <section className="bg-white border border-neutral-200 p-5 grid gap-4">
      <div className="border-b border-neutral-200 pb-3">
        <h2 className="text-lg font-semibold text-humus">Ficha campo — VSA visual (offline)</h2>
        <p className="text-xs text-neutral-500">6 indicadores de 0 (pobre) a 2 (bueno) • Índice 0–100</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {INDICADORES.map((ind) => (
          <label key={ind} className="etiqueta-campo">{ind.replace('_', ' ')}
            <select
              className="campo-entrada"
              value={puntajes[ind] ?? 0}
              onChange={(e) => setPuntajes({ ...puntajes, [ind]: Number(e.target.value) })}
            >
              <option value={0}>0 — pobre</option>
              <option value={1}>1 — moderado</option>
              <option value={2}>2 — bueno</option>
            </select>
          </label>
        ))}
      </div>
      {mensaje && <p className="mensaje-ok">{mensaje}</p>}
      <div><Boton onClick={() => void guardar()}>Guardar VSA offline</Boton></div>
    </section>
  );
}
