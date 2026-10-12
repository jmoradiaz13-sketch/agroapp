import { baseDatos } from '../base_datos/local';

// Niveles de madurez predial (AGENTS.md §5): solo con datos reales,
// nunca por clics vacíos. Puntos por evidencia registrada offline.
export type Nivel = 'Bronce' | 'Plata' | 'Oro' | 'Diamante';

const UMBRALES: { nivel: Nivel; minimo: number }[] = [
  { nivel: 'Bronce', minimo: 0 },
  { nivel: 'Plata', minimo: 50 },
  { nivel: 'Oro', minimo: 150 },
  { nivel: 'Diamante', minimo: 300 },
];

export interface Insignia {
  id: string;
  titulo: string;
  obtenida: boolean;
  detalle: string;
}

export interface Madurez {
  puntos: number;
  nivel: Nivel;
  siguiente: Nivel | null;
  puntosParaSiguiente: number;
  progresoPct: number;
  insignias: Insignia[];
  desglose: { fichas: number; lotes: number; disenos: number; puntos: number; capas: number };
}

export async function calcularMadurez(): Promise<Madurez> {
  const [fichas, lotes, disenos, puntosMuestreo, capas] = await Promise.all([
    baseDatos.fichasSuelo.toArray(),
    baseDatos.lotes.toArray(),
    baseDatos.disenos.toArray(),
    baseDatos.puntosMuestreo.toArray(),
    baseDatos.capasIgac.toArray(),
  ]);
  const desglose = {
    fichas: fichas.length,
    lotes: lotes.length,
    disenos: disenos.length,
    puntos: puntosMuestreo.length,
    capas: capas.length,
  };
  const puntos = desglose.fichas * 10 + desglose.lotes * 5 + desglose.disenos * 15 + desglose.puntos * 5 + desglose.capas * 3;

  let nivel: Nivel = 'Bronce';
  let siguiente: Nivel | null = null;
  for (let i = 0; i < UMBRALES.length; i += 1) {
    if (puntos >= UMBRALES[i].minimo) {
      nivel = UMBRALES[i].nivel;
      siguiente = UMBRALES[i + 1]?.nivel ?? null;
    }
  }
  const base = UMBRALES.find((u) => u.nivel === nivel)?.minimo ?? 0;
  const techo = siguiente ? (UMBRALES.find((u) => u.nivel === siguiente)?.minimo ?? base + 1) : base + 1;
  const progresoPct = siguiente ? Math.min(100, Math.round(((puntos - base) / (techo - base)) * 100)) : 100;

  const conVsa = fichas.filter((f) => f.estructuraVess !== undefined).length;
  const conConservacion = disenos.filter((d) =>
    d.usosSuelo.some((u) => u.uso.toLowerCase().includes('conserv') || u.uso.toLowerCase().includes('corredor')),
  ).length;

  const insignias: Insignia[] = [
    {
      id: 'suelo-vivo',
      titulo: 'Suelo Vivo',
      obtenida: conVsa >= 3,
      detalle: conVsa >= 3 ? `${conVsa} fichas con VSA registrado` : `${conVsa}/3 fichas con VSA`,
    },
    {
      id: 'custodio-bosque',
      titulo: 'Custodio del Bosque',
      obtenida: conConservacion >= 1,
      detalle: conConservacion >= 1 ? `${conConservacion} diseño(s) con conservación` : 'Diseña conservación en el simulador',
    },
  ];

  return {
    puntos,
    nivel,
    siguiente,
    puntosParaSiguiente: siguiente ? techo - puntos : 0,
    progresoPct,
    insignias,
    desglose,
  };
}
