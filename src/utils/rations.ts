// eslint-disable-next-line import/no-named-as-default
import Decimal from 'decimal.js';

/** Gramos de carbohidratos por ración por defecto (1 R = 10 g de HC). */
export const DEFAULT_CARB_RATION_GRAMS = 10;

/** Equivalencias rápidas ofrecidas en el selector (g de HC por ración). */
export const CARB_RATION_OPTIONS = [10, 12, 15] as const;

/**
 * Raciones de hidratos de carbono (R).
 *
 * `raciones = carbohidratos_g / N`, donde N son los gramos de carbohidrato
 * que equivalen a una ración para el usuario.
 *
 * Devuelve un `Decimal` SIN redondear para que el caller redondee solo al
 * mostrar. Nunca hagas aritmética con `number` antes de llamar a esta
 * función: el valor `carbsGrams` debe provenir de un cálculo exacto (Decimal).
 */
export function calcCarbRations(carbsGrams: number, gramsPerRation: number): Decimal {
  if (!Number.isFinite(gramsPerRation) || gramsPerRation <= 0) {
    return new Decimal(0);
  }
  return new Decimal(carbsGrams).div(gramsPerRation);
}

/**
 * Formatea un valor de raciones con `decimals` decimales, redondeo
 * "round half up" (0,05 → 0,1) y coma decimal española. Ej.: 3.795 → "3,8".
 */
export function formatRations(rations: Decimal | number, decimals = 1): string {
  const d = rations instanceof Decimal ? rations : new Decimal(rations);
  return d.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toFixed(decimals).replace('.', ',');
}

/**
 * Parsea una entrada numérica aceptando coma o punto como separador decimal
 * ("2,5" y "2.5" → 2.5). Devuelve `null` si no es un número válido.
 *
 * Evita el fallo más grave posible: que "2,5" se lea como 25.
 */
export function parseDecimalInput(value: string): number | null {
  const s = value.trim();
  if (!s) return null;
  const normalized = s.replace(',', '.');
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
