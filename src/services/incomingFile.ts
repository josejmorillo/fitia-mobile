import { importFromText, parseImportJson, readUriAsText } from './shareService';
import { importWebDatabase } from './webDbImport';

let pendingUri: string | null = null;

export function setPendingIncomingUri(uri: string): void {
  pendingUri = uri;
}

export function takePendingIncomingUri(): string | null {
  const uri = pendingUri;
  pendingUri = null;
  return uri;
}

/**
 * Importa un archivo recibido por intent (abrir con NutriFit). Detecta el tipo
 * por contenido: JSON de NutriFit o base de datos SQLite.
 */
export async function importIncomingUri(uri: string): Promise<string> {
  let text: string | null = null;
  try {
    text = await readUriAsText(uri);
  } catch {
    text = null;
  }

  if (text != null) {
    try {
      parseImportJson(text);
      return await importFromText(text);
    } catch {
      // No es un JSON de NutriFit: probar como base de datos.
    }
  }

  return importWebDatabase(uri);
}
