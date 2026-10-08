import referencias from '../datos/references.json';

export interface ReferenciaLocal {
  id: string;
  tipo: string;
  titulo: string;
  fuente: string;
  categoria: string;
  uso_en_proyecto?: string;
  estado?: string;
}

// Bibliografía embebida offline: no requiere red (AGENTS §4 OFFLINE).
export function listarReferencias(): ReferenciaLocal[] {
  return (referencias as ReferenciaLocal[]).slice(0, 100);
}

export function buscarPorUso(uso: string): ReferenciaLocal[] {
  const u = uso.toLowerCase();
  return listarReferencias().filter((r) =>
    (r.uso_en_proyecto ?? '').toLowerCase().includes(u) ||
    (r.categoria ?? '').toLowerCase().includes(u)
  );
}
