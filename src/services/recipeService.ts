import type { Food, Recipe, RecipeIngredient } from '../utils/types';
import { getDatabase } from './database';

interface IngredientRow {
  ingredientId: number;
  recipeId: number;
  foodId: number;
  amount: number;
  f_id: number;
  f_name: string;
  f_brand: string | null;
  f_category: string | null;
  f_emoji: string | null;
  f_caloriesPer100g: number;
  f_proteinPer100g: number;
  f_carbsPer100g: number;
  f_fatPer100g: number;
  f_servingName: string | null;
  f_servingAmount: number | null;
}

function mapIngredientFood(row: IngredientRow): Food {
  return {
    id: row.f_id,
    name: row.f_name,
    brand: row.f_brand,
    category: row.f_category ?? 'Otros',
    emoji: row.f_emoji ?? '🍽️',
    caloriesPer100g: row.f_caloriesPer100g,
    proteinPer100g: row.f_proteinPer100g,
    carbsPer100g: row.f_carbsPer100g,
    fatPer100g: row.f_fatPer100g,
    servingName: row.f_servingName,
    servingAmount: row.f_servingAmount,
    createdAt: '',
  };
}

export async function getRecipes(): Promise<Recipe[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    emoji: string | null;
    cnt: number;
    servingGrams: number | null;
    totalGrams: number | null;
  }>(
    `SELECT r.id, r.name, r.emoji, COUNT(rf.id) AS cnt,
            r.serving_grams AS "servingGrams",
            COALESCE(SUM(rf.amount), 0) AS "totalGrams"
     FROM recipes r
     LEFT JOIN recipe_foods rf ON rf.recipe_id = r.id
     GROUP BY r.id
     ORDER BY r.name COLLATE NOCASE`
  );
  return rows
    .map((r) => ({
      id: r.id,
      name: r.name,
      emoji: r.emoji ?? '🍽️',
      ingredients: [],
      ingredientCount: r.cnt,
      servingGrams: r.servingGrams,
      totalGrams: r.totalGrams ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

export async function getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<IngredientRow>(
    `SELECT
       rf.id AS "ingredientId",
       rf.recipe_id AS "recipeId",
       rf.food_id AS "foodId",
       rf.amount,
       f.id AS "f_id",
       f.name AS "f_name",
       f.brand AS "f_brand",
       f.category AS "f_category",
       f.emoji AS "f_emoji",
       f.calories_per_100g AS "f_caloriesPer100g",
       f.protein_per_100g AS "f_proteinPer100g",
       f.carbs_per_100g AS "f_carbsPer100g",
       f.fat_per_100g AS "f_fatPer100g",
       f.serving_name AS "f_servingName",
       f.serving_amount AS "f_servingAmount"
     FROM recipe_foods rf
     JOIN foods f ON f.id = rf.food_id
     WHERE rf.recipe_id = ?
     ORDER BY rf.id`,
    [recipeId]
  );

  return rows.map((row) => ({
    id: row.ingredientId,
    recipeId: row.recipeId,
    foodId: row.foodId,
    amount: row.amount,
    food: mapIngredientFood(row),
  }));
}

export async function createRecipe(
  name: string,
  emoji: string,
  servingGrams: number | null = null
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO recipes (name, emoji, serving_grams) VALUES (?, ?, ?)',
    [name, emoji, servingGrams]
  );
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

export async function updateRecipe(
  recipeId: number,
  name: string,
  emoji: string,
  servingGrams: number | null = null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE recipes SET name = ?, emoji = ?, serving_grams = ? WHERE id = ?', [
    name,
    emoji,
    servingGrams,
    recipeId,
  ]);
}

export async function replaceRecipeIngredients(
  recipeId: number,
  ingredients: { foodId: number; amount: number }[]
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM recipe_foods WHERE recipe_id = ?', [recipeId]);
    for (const ing of ingredients) {
      await db.runAsync(
        'INSERT INTO recipe_foods (recipe_id, food_id, amount) VALUES (?, ?, ?)',
        [recipeId, ing.foodId, ing.amount]
      );
    }
  });
}

export async function deleteIngredient(ingredientId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipe_foods WHERE id = ?', [ingredientId]);
}

export async function deleteRecipe(recipeId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipes WHERE id = ?', [recipeId]);
}
