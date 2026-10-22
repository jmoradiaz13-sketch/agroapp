import { baseDatos } from '../base_datos/local';
import { AMBITO_SUELOS, PREDIO_SIN_ASIGNAR } from '../datos/variables_suelo';

// Migra una sola vez las fichas del ámbito legado 'suelos' a un cajón virtual
// sin predio. No las elimina ni las sincroniza: quedan para reasignación manual.
let migracionEnCurso: Promise<number> | null = null;

export const EVENTO_FICHAS_ACTUALIZADAS = 'surcos:fichas-actualizadas';

export function migrarFichasSueloAntiguas(): Promise<number> {
  if (!migracionEnCurso) {
    migracionEnCurso = ejecutarMigracion().catch((error: unknown) => {
      migracionEnCurso = null;
      throw error;
    });
  }
  return migracionEnCurso;
}

async function ejecutarMigracion(): Promise<number> {
  const antiguas = await baseDatos.fichasSuelo.where('predioIdentificador').equals(AMBITO_SUELOS).toArray();
  if (antiguas.length === 0) return 0;

  for (const ficha of antiguas) {
    if (ficha.id === undefined) continue;
    await baseDatos.fichasSuelo.update(ficha.id, {
      predioIdentificador: PREDIO_SIN_ASIGNAR,
      loteAnterior: ficha.loteNombre ?? 'general',
      predioAnterior: AMBITO_SUELOS,
      requiereAsignacion: true,
      sincronizada: false,
    });
    await baseDatos.fotos.where('fichaId').equals(ficha.id).modify({
      predioIdentificador: PREDIO_SIN_ASIGNAR,
      sincronizada: false,
    });
    await baseDatos.monitoreos.where('fichaId').equals(ficha.id).modify({
      predioIdentificador: PREDIO_SIN_ASIGNAR,
      sincronizada: false,
    });
  }

  await baseDatos.fotos.where('predioIdentificador').equals(AMBITO_SUELOS).modify({
    predioIdentificador: PREDIO_SIN_ASIGNAR,
    sincronizada: false,
  });

  return antiguas.length;
}
