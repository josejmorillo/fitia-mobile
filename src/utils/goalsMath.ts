// eslint-disable-next-line import/no-named-as-default
import Decimal from 'decimal.js';

export interface Goals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type GoalMacroField = 'protein' | 'carbs' | 'fat';

const PROTEIN_KCAL = 4;
const CARBS_KCAL = 4;
const FAT_KCAL = 9;

/** Calorías que aportan los macros (aritmética entera, exacta). */
export function macroCalories(protein: number, carbs: number, fat: number): number {
  return PROTEIN_KCAL * protein + CARBS_KCAL * carbs + FAT_KCAL * fat;
}

/**
 * Fija un objetivo de kcal reescalando P/C/G proporcionalmente.
 *
 * La invariante `kcal = 4·P + 4·C + 9·G` SIEMPRE se cumple: la kcal devuelta
 * se recalcula a partir de los gramos enteros resultantes (puede diferir en
 * ±1-2 kcal del objetivo pulsado por el redondeo a gramos enteros).
 */
export function reconcileCalories(targetKcal: number, current: Goals): Goals {
  const total = macroCalories(current.protein, current.carbs, current.fat);
  const target = Math.max(0, targetKcal);

  if (total <= 0) {
    // Sin macros previos: asignamos las calorías a carbohidratos para no violar la invariante.
    const carbs = Math.round(target / CARBS_KCAL);
    return { protein: 0, carbs, fat: 0, kcal: macroCalories(0, carbs, 0) };
  }

  const factor = new Decimal(target).div(total);
  const protein = new Decimal(current.protein)
    .mul(factor)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
  const carbs = new Decimal(current.carbs)
    .mul(factor)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
  const fat = new Decimal(current.fat)
    .mul(factor)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();

  return { protein, carbs, fat, kcal: macroCalories(protein, carbs, fat) };
}

/** Ajusta un macro y recalcula las calorías (los otros dos quedan fijos). */
export function reconcileMacro(field: GoalMacroField, value: number, current: Goals): Goals {
  const next: Goals = { ...current, [field]: Math.max(0, Math.round(value)) };
  return { ...next, kcal: macroCalories(next.protein, next.carbs, next.fat) };
}

/** Construye los objetivos a partir de la estimación, dejando kcal exacta. */
export function goalsFromEstimate(estimate: {
  protein: number;
  carbs: number;
  fat: number;
}): Goals {
  return {
    protein: estimate.protein,
    carbs: estimate.carbs,
    fat: estimate.fat,
    kcal: macroCalories(estimate.protein, estimate.carbs, estimate.fat),
  };
}
