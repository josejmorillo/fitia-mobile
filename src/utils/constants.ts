import type { MealType } from './types';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snacks: 'Snacks',
};

const FOOD_CATEGORIES_BASE = [
  'Aperitivos',
  'Bebidas',
  'Carnes',
  'Cereales y Legumbres',
  'Condimentos',
  'Embutidos',
  'Frutas',
  'Frutos Secos',
  'Grasas',
  'Huevos',
  'Legumbres',
  'Lácteos y Derivados',
  'Mariscos',
  'Otros',
  'Panadería',
  'Pescados',
  'Postres',
  'Precocinados',
  'Salsas',
  'Snacks',
  'Verduras y Tubérculos',
];

export const FOOD_CATEGORIES = [...FOOD_CATEGORIES_BASE].sort((a, b) =>
  a.localeCompare(b, 'es', { sensitivity: 'base' })
);

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];
