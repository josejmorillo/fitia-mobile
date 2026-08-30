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
