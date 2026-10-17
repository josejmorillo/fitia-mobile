import { describe, expect, it } from 'vitest';

import {
  foodMacros,
  ingredientTotals,
  recipeMacros,
  round1,
  scaleMacros,
  sumMacros,
} from '../macros';
import type { Food } from '../types';

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 1,
    name: 'Test',
    brand: null,
    category: 'Otros',
    emoji: '🍽️',
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    servingName: null,
    servingAmount: null,
    createdAt: '',
    ...overrides,
  };
}

describe('foodMacros', () => {
  it('calcula HC sin redondear: 150 g de 25,3 g/100g → 37,95 g', () => {
    const macros = foodMacros(makeFood({ carbsPer100g: 25.3 }), 150);
    expect(macros.carbs).toBeCloseTo(37.95, 10);
  });
});

describe('sumMacros', () => {
  it('suma sin acumular error de redondeo (1,25 + 1,25 = 2,5, no 2,6)', () => {
    const m1 = foodMacros(makeFood({ carbsPer100g: 1.25 }), 100);
    const m2 = foodMacros(makeFood({ carbsPer100g: 1.25 }), 100);
    const total = sumMacros([m1, m2]);

    expect(total.carbs).toBeCloseTo(2.5, 10);
    // La suma de valores redondeados individualmente daría 2,6 (error).
    expect(round1(m1.carbs) + round1(m2.carbs)).toBeCloseTo(2.6, 10);
    expect(total.carbs).not.toBeCloseTo(round1(m1.carbs) + round1(m2.carbs), 10);
  });
});

describe('ingredientTotals', () => {
  it('suma exacta sin error de coma flotante (0,1 + 0,2 = 0,3)', () => {
    const totals = ingredientTotals([
      { food: makeFood({ carbsPer100g: 0.1 }), amount: 100 },
      { food: makeFood({ carbsPer100g: 0.2 }), amount: 100 },
    ]);
    expect(totals.carbs).toBe(0.3);
  });
});

describe('recipeMacros', () => {
  it('aplica proporción distinta a la original', () => {
    const totals = ingredientTotals([{ food: makeFood({ carbsPer100g: 25.3 }), amount: 200 }]);
    expect(totals.carbs).toBeCloseTo(50.6, 10);
    expect(totals.totalGrams).toBe(200);

    const served = recipeMacros(totals, 60); // 60 g de una receta de 200 g
    expect(served.carbs).toBeCloseTo(15.18, 10);
  });
});

describe('scaleMacros', () => {
  it('escala proporcionalmente sin redondear', () => {
    const base = foodMacros(makeFood({ carbsPer100g: 25.3 }), 150); // 37,95 g
    const scaled = scaleMacros(base, 150, 75); // la mitad
    expect(scaled.carbs).toBeCloseTo(18.975, 10);
  });
});
