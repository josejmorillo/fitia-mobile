// eslint-disable-next-line import/no-named-as-default
import Decimal from 'decimal.js';

import type { Food, MacroSummary } from './types';

/**
 * Macros consumidos de un alimento según los gramos.
 * Devuelve valores SIN redondear (solo se redondea al mostrar).
 */
export function foodMacros(food: Food, amount: number): MacroSummary {
  const factor = new Decimal(amount).div(100);
  return {
    calories: new Decimal(food.caloriesPer100g).mul(factor).toNumber(),
    protein: new Decimal(food.proteinPer100g).mul(factor).toNumber(),
    carbs: new Decimal(food.carbsPer100g).mul(factor).toNumber(),
    fat: new Decimal(food.fatPer100g).mul(factor).toNumber(),
  };
}

export interface IngredientTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  totalGrams: number;
}

/**
 * Totales exactos (sin redondear) de una lista de ingredientes.
 * La suma se hace con Decimal para no acumular error de coma flotante.
 */
export function ingredientTotals(
  ingredients: { food: Food; amount: number }[]
): IngredientTotals {
  const totals = ingredients.reduce<{
    calories: Decimal;
    protein: Decimal;
    carbs: Decimal;
    fat: Decimal;
    totalGrams: Decimal;
  }>(
    (acc, ing) => {
      const factor = new Decimal(ing.amount).div(100);
      return {
        calories: acc.calories.plus(new Decimal(ing.food.caloriesPer100g).mul(factor)),
        protein: acc.protein.plus(new Decimal(ing.food.proteinPer100g).mul(factor)),
        carbs: acc.carbs.plus(new Decimal(ing.food.carbsPer100g).mul(factor)),
        fat: acc.fat.plus(new Decimal(ing.food.fatPer100g).mul(factor)),
        totalGrams: acc.totalGrams.plus(ing.amount),
      };
    },
    {
      calories: new Decimal(0),
      protein: new Decimal(0),
      carbs: new Decimal(0),
      fat: new Decimal(0),
      totalGrams: new Decimal(0),
    }
  );
  return {
    calories: totals.calories.toNumber(),
    protein: totals.protein.toNumber(),
    carbs: totals.carbs.toNumber(),
    fat: totals.fat.toNumber(),
    totalGrams: totals.totalGrams.toNumber(),
  };
}

/** Macros de una receta según los gramos servidos (proporcional al peso total), sin redondear. */
export function recipeMacros(totals: IngredientTotals, amountGrams: number): MacroSummary {
  const ratio =
    totals.totalGrams > 0 ? new Decimal(amountGrams).div(totals.totalGrams) : new Decimal(0);
  return {
    calories: new Decimal(totals.calories).mul(ratio).toNumber(),
    protein: new Decimal(totals.protein).mul(ratio).toNumber(),
    carbs: new Decimal(totals.carbs).mul(ratio).toNumber(),
    fat: new Decimal(totals.fat).mul(ratio).toNumber(),
  };
}

/**
 * Suma de macros SIN redondear los sumandos individuales. La suma se hace con
 * Decimal para no acumular error de coma flotante. El redondeo se aplica solo
 * al mostrar el resultado final.
 */
export function sumMacros(macros: MacroSummary[]): MacroSummary {
  const total = macros.reduce<{
    calories: Decimal;
    protein: Decimal;
    carbs: Decimal;
    fat: Decimal;
  }>(
    (acc, m) => ({
      calories: acc.calories.plus(new Decimal(m.calories)),
      protein: acc.protein.plus(new Decimal(m.protein)),
      carbs: acc.carbs.plus(new Decimal(m.carbs)),
      fat: acc.fat.plus(new Decimal(m.fat)),
    }),
    {
      calories: new Decimal(0),
      protein: new Decimal(0),
      carbs: new Decimal(0),
      fat: new Decimal(0),
    }
  );
  return {
    calories: total.calories.toNumber(),
    protein: total.protein.toNumber(),
    carbs: total.carbs.toNumber(),
    fat: total.fat.toNumber(),
  };
}

/** Escala un MacroSummary (sin redondear) proporcionalmente entre cantidades. */
export function scaleMacros(macros: MacroSummary, fromAmount: number, toAmount: number): MacroSummary {
  const ratio =
    fromAmount > 0 ? new Decimal(toAmount).div(fromAmount) : new Decimal(0);
  return {
    calories: new Decimal(macros.calories).mul(ratio).toNumber(),
    protein: new Decimal(macros.protein).mul(ratio).toNumber(),
    carbs: new Decimal(macros.carbs).mul(ratio).toNumber(),
    fat: new Decimal(macros.fat).mul(ratio).toNumber(),
  };
}

/** Redondeo a 1 decimal para mostrar gramos de macro (mismo formato que la app). */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
