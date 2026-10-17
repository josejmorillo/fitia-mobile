/** Normaliza texto para búsqueda: minúsculas y sin tildes (diacríticos). */
export function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Normaliza un nombre para comparación exacta: minúsculas, sin tildes y espacios colapsados. */
export function normalizeName(s: string): string {
  return normalizeForSearch(s).replace(/\s+/g, ' ').trim();
}
