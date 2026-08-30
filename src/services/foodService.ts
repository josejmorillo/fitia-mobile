import type { Food } from '../utils/types';
import { getDatabase } from './database';
import { FOOD_SELECT, mapFoodRow, type FoodRow } from './mappers';

export type FoodInput = Omit<Food, 'id' | 'createdAt'>;

export async function getAllFoods(): Promise<Food[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT ${FOOD_SELECT} FROM foods ORDER BY name COLLATE NOCASE`
  );
  return rows.map(mapFoodRow);
}

export async function searchFoods(query: string): Promise<Food[]> {
  const db = await getDatabase();
  const like = `%${query}%`;
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT ${FOOD_SELECT} FROM foods
     WHERE name LIKE ? OR brand LIKE ?
     ORDER BY name COLLATE NOCASE`,
    [like, like]
  );
  return rows.map(mapFoodRow);
}

export async function getFood(id: number): Promise<Food | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<FoodRow>(
    `SELECT ${FOOD_SELECT} FROM foods WHERE id = ?`,
    [id]
  );
  return row ? mapFoodRow(row) : null;
}

export async function createFood(input: FoodInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO foods
       (name, brand, category, emoji, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_name, serving_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.brand,
      input.category,
      input.emoji,
      input.caloriesPer100g,
      input.proteinPer100g,
      input.carbsPer100g,
      input.fatPer100g,
      input.servingName,
      input.servingAmount,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateFood(id: number, input: FoodInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE foods SET
       name = ?, brand = ?, category = ?, emoji = ?,
       calories_per_100g = ?, protein_per_100g = ?, carbs_per_100g = ?, fat_per_100g = ?,
       serving_name = ?, serving_amount = ?
     WHERE id = ?`,
    [
      input.name,
      input.brand,
      input.category,
      input.emoji,
      input.caloriesPer100g,
      input.proteinPer100g,
      input.carbsPer100g,
      input.fatPer100g,
      input.servingName,
      input.servingAmount,
      id,
    ]
  );
}

export async function deleteFood(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM foods WHERE id = ?', [id]);
}

export async function countFoodReferences(id: number): Promise<number> {
  const db = await getDatabase();
  const items = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM daily_log_items WHERE food_id = ?',
    [id]
  );
  const recipes = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM recipe_foods WHERE food_id = ?',
    [id]
  );
  return (items?.c ?? 0) + (recipes?.c ?? 0);
}
