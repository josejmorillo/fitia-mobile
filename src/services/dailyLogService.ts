import type { DailyLog, DailyLogItem, Food, MealType } from '../utils/types';
import { getDatabase } from './database';

interface DailyLogItemRow {
  id: number;
  dailyLogId: number;
  mealType: MealType;
  foodId: number | null;
  recipeId: number | null;
  amount: number;
  consumed: number;
  sortOrder: number;
  sourceItemId: number | null;
  f_id: number | null;
  f_name: string | null;
  f_brand: string | null;
  f_category: string | null;
  f_emoji: string | null;
  f_caloriesPer100g: number | null;
  f_proteinPer100g: number | null;
  f_carbsPer100g: number | null;
  f_fatPer100g: number | null;
  f_servingName: string | null;
  f_servingAmount: number | null;
}

function mapItemRow(row: DailyLogItemRow): DailyLogItem {
  let food: Food | undefined;
  if (row.f_id != null) {
    food = {
      id: row.f_id,
      name: row.f_name ?? '',
      brand: row.f_brand,
      category: row.f_category ?? 'Otros',
      emoji: row.f_emoji ?? '🍽️',
      caloriesPer100g: row.f_caloriesPer100g ?? 0,
      proteinPer100g: row.f_proteinPer100g ?? 0,
      carbsPer100g: row.f_carbsPer100g ?? 0,
      fatPer100g: row.f_fatPer100g ?? 0,
      servingName: row.f_servingName,
      servingAmount: row.f_servingAmount,
      createdAt: '',
    };
  }

  return {
    id: row.id,
    dailyLogId: row.dailyLogId,
    mealType: row.mealType,
    foodId: row.foodId,
    recipeId: row.recipeId,
    amount: row.amount,
    consumed: row.consumed === 1,
    sortOrder: row.sortOrder,
    sourceItemId: row.sourceItemId,
    food,
    recipe: undefined,
  };
}

export async function getOrCreateDailyLog(date: string): Promise<DailyLog> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO daily_logs (date) VALUES (?)', [date]);
  const row = await db.getFirstAsync<{ id: number; date: string }>(
    'SELECT id, date FROM daily_logs WHERE date = ?',
    [date]
  );
  return { id: row!.id, date: row!.date, items: [] };
}

export async function getDailyLogItems(logId: number): Promise<DailyLogItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyLogItemRow>(
    `SELECT
       dli.id,
       dli.daily_log_id AS "dailyLogId",
       dli.meal_type AS "mealType",
       dli.food_id AS "foodId",
       dli.recipe_id AS "recipeId",
       dli.amount,
       dli.consumed,
       dli.sort_order AS "sortOrder",
       dli.source_item_id AS "sourceItemId",
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
     FROM daily_log_items dli
     LEFT JOIN foods f ON f.id = dli.food_id
     WHERE dli.daily_log_id = ?
     ORDER BY
       CASE dli.meal_type
         WHEN 'breakfast' THEN 0
         WHEN 'lunch' THEN 1
         WHEN 'dinner' THEN 2
         WHEN 'snacks' THEN 3
         ELSE 4
       END,
       dli.sort_order,
       dli.id`,
    [logId]
  );
  return rows.map(mapItemRow);
}

export async function addItem(
  logId: number,
  mealType: MealType,
  foodId: number,
  amount: number
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO daily_log_items (daily_log_id, meal_type, food_id, amount, consumed, sort_order)
     VALUES (?, ?, ?, ?, 1, COALESCE((SELECT MAX(sort_order) + 1 FROM daily_log_items WHERE daily_log_id = ? AND meal_type = ?), 0))`,
    [logId, mealType, foodId, amount, logId, mealType]
  );
  return result.lastInsertRowId;
}

export async function updateItemAmount(itemId: number, amount: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE daily_log_items SET amount = ? WHERE id = ?', [amount, itemId]);
}

export async function toggleItemConsumed(itemId: number, consumed: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE daily_log_items SET consumed = ? WHERE id = ?', [consumed ? 1 : 0, itemId]);
}

export async function deleteItem(itemId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM daily_log_items WHERE id = ?', [itemId]);
}
