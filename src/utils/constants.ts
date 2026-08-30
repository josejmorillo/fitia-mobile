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
  'Cereales',
  'Condimentos',
  'Embutidos',
  'Frutas',
  'Grasas',
  'Huevos',
  'Legumbres',
  'Lácteos',
  'Mariscos',
  'Otros',
  'Panes y masas',
  'Pescados',
  'Postres',
  'Precocinados',
  'Salsas',
  'Snacks',
  'Verduras',
];

export const FOOD_CATEGORIES = [...FOOD_CATEGORIES_BASE].sort((a, b) =>
  a.localeCompare(b, 'es', { sensitivity: 'base' })
);

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];
