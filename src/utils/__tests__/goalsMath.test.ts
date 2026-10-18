import { describe, expect, it } from 'vitest';

import {
  goalsFromEstimate,
  macroCalories,
  reconcileCalories,
  reconcileMacro,
  type Goals,
} from '../goalsMath';

const base: Goals = { kcal: 2003, protein: 150, carbs: 200, fat: 67 };

function invariant(g: Goals) {
  return macroCalories(g.protein, g.carbs, g.fat) === g.kcal;
}

describe('macroCalories', () => {
  it('calcula 4·P + 4·C + 9·G', () => {
    expect(macroCalories(150, 200, 67)).toBe(2003);
  });

  it('es exacta con valores grandes (sin error de coma flotante)', () => {
    expect(macroCalories(300, 400, 100)).toBe(3700);
  });
});

describe('reconcileMacro', () => {
  it('cambiar proteína recalcula las calorías y deja C y G fijos', () => {
    const g = reconcileMacro('protein', 160, base);
    expect(g).toEqual({ protein: 160, carbs: 200, fat: 67, kcal: 2043 });
  });

  it('cambiar carbos recalcula las calorías', () => {
    const g = reconcileMacro('carbs', 0, base);
    expect(g.kcal).toBe(4 * 150 + 0 + 9 * 67);
    expect(invariant(g)).toBe(true);
  });

  it('redondea entradas decimales', () => {
    const g = reconcileMacro('protein', 150.6, base);
    expect(g.protein).toBe(151);
    expect(invariant(g)).toBe(true);
  });

  it('no permite valores negativos', () => {
    const g = reconcileMacro('fat', -10, base);
    expect(g.fat).toBe(0);
    expect(invariant(g)).toBe(true);
  });
});

describe('reconcileCalories', () => {
  it('reescala los macros proporcionalmente y mantiene la invariante', () => {
    const g = reconcileCalories(1800, base);
    expect(g).toEqual({ protein: 135, carbs: 180, fat: 60, kcal: 1800 });
    expect(invariant(g)).toBe(true);
  });

  it('con objetivo no redondo, la kcal resultante es la suma exacta', () => {
    const g = reconcileCalories(1500, base);
    expect(g.protein).toBe(112);
    expect(g.carbs).toBe(150);
    expect(g.fat).toBe(50);
    expect(g.kcal).toBe(1498);
    expect(invariant(g)).toBe(true);
  });

  it('con macros a cero, asigna las calorías a carbohidratos', () => {
    const g = reconcileCalories(100, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    expect(g).toEqual({ protein: 0, carbs: 25, fat: 0, kcal: 100 });
    expect(invariant(g)).toBe(true);
  });

  it('objetivo negativo deja todo a cero', () => {
    const g = reconcileCalories(-50, base);
    expect(g).toEqual({ protein: 0, carbs: 0, fat: 0, kcal: 0 });
    expect(invariant(g)).toBe(true);
  });
});

describe('goalsFromEstimate', () => {
  it('usa la kcal exacta de los macros', () => {
    const g = goalsFromEstimate({ protein: 150, carbs: 200, fat: 67 });
    expect(g).toEqual({ protein: 150, carbs: 200, fat: 67, kcal: 2003 });
    expect(invariant(g)).toBe(true);
  });
});
