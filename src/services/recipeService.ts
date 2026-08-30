import type { Recipe, RecipeIngredient } from '../utils/types';
import { getDatabase } from './database';
import { mapFoodRow, type FoodRow } from './mappers';

export async function getRecipes(): Promise<Recipe[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: number; name: string; emoji: string | null; cnt: number }>(
    `SELECT r.id, r.name, r.emoji, COUNT(rf.id) AS cnt
     FROM recipes r
     LEFT JOIN recipe_foods rf ON rf.recipe_id = r.id
     GROUP BY r.id
     ORDER BY r.name COLLATE NOCASE`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji ?? '🍽️',
    ingredients: [],
    ingredientCount: r.cnt,
  }));
}

interface IngredientRow extends FoodRow {
  id: number;
  recipeId: number;
  foodId: number;
  amount: number;
}

export async function getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<IngredientRow>(
    `SELECT
       rf.id,
       rf.recipe_id AS "recipeId",
       rf.food_id AS "foodId",
       rf.amount,
       f.id,
       f.name, f.brand, f.category, f.emoji,
       f.calories_per_100g AS "caloriesPer100g",
       f.protein_per_100g AS "proteinPer100g",
       f.carbs_per_100g AS "carbsPer100g",
       f.fat_per_100g AS "fatPer100g",
       f.serving_name AS "servingName",
       f.serving_amount AS "servingAmount",
       f.created_at AS "createdAt"
     FROM recipe_foods rf
     JOIN foods f ON f.id = rf.food_id
     WHERE rf.recipe_id = ?
     ORDER BY rf.id`,
    [recipeId]
  );

  return rows.map((row) => ({
    id: row.id,
    recipeId: row.recipeId,
    foodId: row.foodId,
    amount: row.amount,
    food: mapFoodRow(row),
  }));
}

export async function createRecipe(name: string, emoji: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync('INSERT INTO recipes (name, emoji) VALUES (?, ?)', [name, emoji]);
  return result.lastInsertRowId;
}

export async function addIngredient(recipeId: number, foodId: number, amount: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO recipe_foods (recipe_id, food_id, amount) VALUES (?, ?, ?)', [
    recipeId,
    foodId,
    amount,
  ]);
}

export async function deleteIngredient(ingredientId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipe_foods WHERE id = ?', [ingredientId]);
}

export async function deleteRecipe(recipeId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipes WHERE id = ?', [recipeId]);
}
