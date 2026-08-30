import type { Food } from '../utils/types';

export interface FoodRow {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  emoji: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingName: string | null;
  servingAmount: number | null;
  createdAt: string;
}

export const FOOD_SELECT = `
  id, name, brand, category, emoji,
  calories_per_100g AS "caloriesPer100g",
  protein_per_100g AS "proteinPer100g",
  carbs_per_100g AS "carbsPer100g",
  fat_per_100g AS "fatPer100g",
  serving_name AS "servingName",
  serving_amount AS "servingAmount",
  created_at AS "createdAt"
`;

export function mapFoodRow(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category ?? 'Otros',
    emoji: row.emoji ?? '🍽️',
    caloriesPer100g: row.caloriesPer100g,
    proteinPer100g: row.proteinPer100g,
    carbsPer100g: row.carbsPer100g,
    fatPer100g: row.fatPer100g,
    servingName: row.servingName,
    servingAmount: row.servingAmount,
    createdAt: row.createdAt,
  };
}
