import type { Food, MacroSummary } from './types';

export function foodMacros(food: Food, amount: number): MacroSummary {
  const factor = amount / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: round1(food.proteinPer100g * factor),
    carbs: round1(food.carbsPer100g * factor),
    fat: round1(food.fatPer100g * factor),
  };
}

export interface IngredientTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  totalGrams: number;
}

/** Totales exactos (sin redondear) de una lista de ingredientes. */
export function ingredientTotals(
  ingredients: { food: Food; amount: number }[]
): IngredientTotals {
  return ingredients.reduce<IngredientTotals>(
    (acc, ing) => {
      const factor = ing.amount / 100;
      return {
        calories: acc.calories + ing.food.caloriesPer100g * factor,
        protein: acc.protein + ing.food.proteinPer100g * factor,
        carbs: acc.carbs + ing.food.carbsPer100g * factor,
        fat: acc.fat + ing.food.fatPer100g * factor,
        totalGrams: acc.totalGrams + ing.amount,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, totalGrams: 0 }
  );
}

/** Macros de una receta según los gramos servidos (proporcional al peso total). */
export function recipeMacros(totals: IngredientTotals, amountGrams: number): MacroSummary {
  const ratio = totals.totalGrams > 0 ? amountGrams / totals.totalGrams : 0;
  return {
    calories: Math.round(totals.calories * ratio),
    protein: round1(totals.protein * ratio),
    carbs: round1(totals.carbs * ratio),
    fat: round1(totals.fat * ratio),
  };
}

export function sumMacros(macros: MacroSummary[]): MacroSummary {
  const total = macros.reduce<MacroSummary>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    calories: Math.round(total.calories),
    protein: round1(total.protein),
    carbs: round1(total.carbs),
    fat: round1(total.fat),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
