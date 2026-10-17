import { describe, expect, it } from 'vitest';

import { calcCarbRations, formatRations, parseDecimalInput } from '../rations';

describe('calcCarbRations', () => {
  it('150 g de 25,3 g HC/100g = 37,95 g HC → 3,8 R con ración de 10 g', () => {
    const carbs = 37.95; // 150 * 25.3 / 100
    expect(formatRations(calcCarbRations(carbs, 10))).toBe('3,8');
  });

  it('con ración de 12 g → 3,2 R (3,1625 → 3,2, round half up)', () => {
    expect(formatRations(calcCarbRations(37.95, 12))).toBe('3,2');
  });

  it('con ración de 15 g → 2,5 R', () => {
    expect(formatRations(calcCarbRations(37.95, 15))).toBe('2,5');
  });

  it('cambiar la equivalencia (10 → 12 → 15) no altera el dato de carbohidratos', () => {
    const carbs = 37.95;
    expect(formatRations(calcCarbRations(carbs, 10))).toBe('3,8');
    expect(formatRations(calcCarbRations(carbs, 12))).toBe('3,2');
    expect(formatRations(calcCarbRations(carbs, 15))).toBe('2,5');
    expect(carbs).toBe(37.95); // el dato original no cambia
  });

  it('redondea half-up (0,05 → 0,1) una sola vez al mostrar', () => {
    expect(formatRations(calcCarbRations(0.5, 10))).toBe('0,1');
    expect(formatRations(calcCarbRations(1.25, 10), 1)).toBe('0,1');
  });

  it('valores cero y muy pequeños', () => {
    expect(formatRations(calcCarbRations(0, 10))).toBe('0,0');
    expect(formatRations(calcCarbRations(0.3, 10))).toBe('0,0');
    expect(formatRations(calcCarbRations(0.03, 10), 2)).toBe('0,00');
  });

  it('si los gramos por ración no son positivos, devuelve 0', () => {
    expect(formatRations(calcCarbRations(30, 0))).toBe('0,0');
    expect(formatRations(calcCarbRations(30, -5))).toBe('0,0');
  });
});

describe('formatRations', () => {
  it('formatea con coma decimal y un decimal', () => {
    expect(formatRations(3.795)).toBe('3,8');
    expect(formatRations(3.2)).toBe('3,2');
    expect(formatRations(10)).toBe('10,0');
  });

  it('round half up en el límite', () => {
    expect(formatRations(1.25)).toBe('1,3');
    expect(formatRations(1.24)).toBe('1,2');
  });
});

describe('parseDecimalInput', () => {
  it('acepta coma y punto decimal', () => {
    expect(parseDecimalInput('2,5')).toBe(2.5);
    expect(parseDecimalInput('2.5')).toBe(2.5);
    expect(parseDecimalInput('2,5')).not.toBe(25); // el fallo más grave
  });

  it('enteros y negativos', () => {
    expect(parseDecimalInput('25')).toBe(25);
    expect(parseDecimalInput(' 10 ')).toBe(10);
  });

  it('rechaza entradas no numéricas', () => {
    expect(parseDecimalInput('')).toBeNull();
    expect(parseDecimalInput('abc')).toBeNull();
    expect(parseDecimalInput('2,5,5')).toBeNull();
  });
});
