import { setPendingIncomingUri } from '@/services/incomingFile';

/**
 * Intercepta las URLs de intent nativas. Si el sistema abre NutriFit con un
 * archivo (`content://` / `file://`), no es una ruta de la app: se guarda la URI
 * para importarla y se redirige a la pantalla principal (evita "Unmatched Route").
 */
export async function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): Promise<string | null> {
  try {
    if (path.startsWith('content://') || path.startsWith('file://')) {
      setPendingIncomingUri(path);
      return '/plan';
    }
    return path;
  } catch {
    return '/plan';
  }
}
