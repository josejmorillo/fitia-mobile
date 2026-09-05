import type { DailyLog, DailyLogItem, Food, MacroSummary, MealType, Recipe } from '../utils/types';
import { getDatabase } from './database';
import { addDays, parseDateString } from '../utils/dates';
import { foodMacros, recipeMacros, type IngredientTotals } from '../utils/macros';

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
  r_id: number | null;
  r_name: string | null;
  r_emoji: string | null;
  r_servingGrams: number | null;
}

function mapFoodFromRow(row: DailyLogItemRow): Food | undefined {
  if (row.f_id == null) return undefined;
  return {
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

function mapRecipeFromRow(row: DailyLogItemRow): Recipe | undefined {
  if (row.r_id == null) return undefined;
  return {
    id: row.r_id,
    name: row.r_name ?? '',
    emoji: row.r_emoji ?? '🍽️',
    ingredients: [],
    servingGrams: row.r_servingGrams,
    totalGrams: 0,
  };
}

function computeItemMacros(
  row: DailyLogItemRow,
  food: Food | undefined,
  recipe: Recipe | undefined,
  recipeTotals: Map<number, IngredientTotals>
): MacroSummary {
  if (food) return foodMacros(food, row.amount);
  if (recipe) {
    const totals = recipeTotals.get(recipe.id);
    return recipeMacros(
      totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0, totalGrams: 0 },
      row.amount
    );
  }
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

async function loadRecipeTotals(recipeIds: number[]): Promise<Map<number, IngredientTotals>> {
  const map = new Map<number, IngredientTotals>();
  if (recipeIds.length === 0) return map;
  const db = await getDatabase();
  const placeholders = recipeIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<{
    recipeId: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    totalGrams: number;
  }>(
    `SELECT
       rf.recipe_id AS "recipeId",
       SUM(f.calories_per_100g * rf.amount / 100) AS calories,
       SUM(f.protein_per_100g * rf.amount / 100) AS protein,
       SUM(f.carbs_per_100g * rf.amount / 100) AS carbs,
       SUM(f.fat_per_100g * rf.amount / 100) AS fat,
       SUM(rf.amount) AS "totalGrams"
     FROM recipe_foods rf
     JOIN foods f ON f.id = rf.food_id
     WHERE rf.recipe_id IN (${placeholders})
     GROUP BY rf.recipe_id`,
    recipeIds
  );
  for (const row of rows) {
    map.set(row.recipeId, {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      totalGrams: row.totalGrams,
    });
  }
  return map;
}

function mapItemRow(row: DailyLogItemRow, recipeTotals: Map<number, IngredientTotals>): DailyLogItem {
  const food = mapFoodFromRow(row);
  const recipe = mapRecipeFromRow(row);
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
    recipe,
    macros: computeItemMacros(row, food, recipe, recipeTotals),
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

const ITEM_SELECT = `
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
   f.serving_amount AS "f_servingAmount",
   r.id AS "r_id",
   r.name AS "r_name",
   r.emoji AS "r_emoji",
   r.serving_grams AS "r_servingGrams"
`;

export async function getDailyLogItems(logId: number): Promise<DailyLogItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyLogItemRow>(
    `SELECT ${ITEM_SELECT}
     FROM daily_log_items dli
     LEFT JOIN foods f ON f.id = dli.food_id
     LEFT JOIN recipes r ON r.id = dli.recipe_id
     WHERE dli.daily_log_id = ?
     ORDER BY
       CASE dli.meal_type
         WHEN 'breakfast' THEN 0
         WHEN 'lunch' THEN 1
         WHEN 'dinner' THEN 2
         WHEN 'snacks' THEN 3
         ELSE 4
       END,
       dli.consumed DESC,
       dli.sort_order,
       dli.id`,
    [logId]
  );
  const recipeIds = Array.from(new Set(rows.map((r) => r.recipeId).filter((id): id is number => id != null)));
  const recipeTotals = await loadRecipeTotals(recipeIds);
  return rows.map((row) => mapItemRow(row, recipeTotals));
}

export async function getCaloriesByDateRange(
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string; foodCal: number | null; recipeId: number | null; amount: number }>(
    `SELECT dl.date,
            f.calories_per_100g AS "foodCal",
            dli.recipe_id AS "recipeId",
            dli.amount
     FROM daily_log_items dli
     JOIN daily_logs dl ON dl.id = dli.daily_log_id
     LEFT JOIN foods f ON f.id = dli.food_id
     WHERE dli.consumed = 1 AND dl.date BETWEEN ? AND ?`,
    [startDate, endDate]
  );
  const recipeIds = Array.from(new Set(rows.map((r) => r.recipeId).filter((id): id is number => id != null)));
  const recipeTotals = await loadRecipeTotals(recipeIds);

  const byDate = new Map<string, number>();
  for (const row of rows) {
    let cal = 0;
    if (row.foodCal != null) {
      cal = row.foodCal * row.amount / 100;
    } else if (row.recipeId != null) {
      const totals = recipeTotals.get(row.recipeId);
      if (totals && totals.totalGrams > 0) {
        cal = totals.calories * (row.amount / totals.totalGrams);
      }
    }
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + cal);
  }

  const result: Record<string, number> = {};
  for (const [date, cal] of byDate) {
    result[date] = Math.round(cal);
  }
  return result;
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

export async function addRecipeItem(
  logId: number,
  mealType: MealType,
  recipeId: number,
  amountGrams: number
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO daily_log_items (daily_log_id, meal_type, recipe_id, amount, consumed, sort_order)
     VALUES (?, ?, ?, ?, 1, COALESCE((SELECT MAX(sort_order) + 1 FROM daily_log_items WHERE daily_log_id = ? AND meal_type = ?), 0))`,
    [logId, mealType, recipeId, amountGrams, logId, mealType]
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

export async function copyItemToDate(itemId: number, targetDate: string): Promise<void> {
  const db = await getDatabase();
  const source = await db.getFirstAsync<{
    food_id: number | null;
    recipe_id: number | null;
    amount: number;
    meal_type: MealType;
  }>('SELECT food_id, recipe_id, amount, meal_type FROM daily_log_items WHERE id = ?', [itemId]);

  if (!source || (source.food_id == null && source.recipe_id == null)) return;

  const targetLog = await getOrCreateDailyLog(targetDate);
  await db.runAsync(
    `INSERT INTO daily_log_items (daily_log_id, meal_type, food_id, recipe_id, amount, consumed, sort_order, source_item_id)
     VALUES (?, ?, ?, ?, ?, 0, COALESCE((SELECT MAX(sort_order) + 1 FROM daily_log_items WHERE daily_log_id = ? AND meal_type = ?), 0), ?)`,
    [targetLog.id, source.meal_type, source.food_id, source.recipe_id, source.amount, targetLog.id, source.meal_type, itemId]
  );
}

const DAY_OF_WEEK: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export interface RepeatMealOptions {
  sourceDate: string;
  weeks: number;
  selectedDays: string[];
  mealType: MealType;
}

/**
 * Copia los alimentos de una comida del día origen a los días de la semana
 * elegidos durante las próximas `weeks` semanas. Los alimentos se añaden a lo
 * que ya exista (merge) y llegan sin marcar (consumed = 0).
 * Devuelve el número de días destino afectados.
 */
export async function repeatMeal(options: RepeatMealOptions): Promise<number> {
  const db = await getDatabase();

  const sourceItems = await db.getAllAsync<{
    id: number;
    foodId: number | null;
    recipeId: number | null;
    amount: number;
  }>(
    `SELECT dli.id, dli.food_id AS "foodId", dli.recipe_id AS "recipeId", dli.amount
     FROM daily_log_items dli
     JOIN daily_logs dl ON dl.id = dli.daily_log_id
     WHERE dl.date = ? AND dli.meal_type = ?
     ORDER BY dli.sort_order, dli.id`,
    [options.sourceDate, options.mealType]
  );
  const items = sourceItems.filter((i) => i.foodId != null || i.recipeId != null);
  if (items.length === 0) return 0;

  const targets = new Set<string>();
  for (let w = 0; w < options.weeks; w++) {
    const windowStart = addDays(options.sourceDate, w * 7 + 1);
    const startDow = parseDateString(windowStart).getDay();
    for (const day of options.selectedDays) {
      const targetDow = DAY_OF_WEEK[day];
      if (targetDow == null) continue;
      const delta = (targetDow - startDow + 7) % 7;
      targets.add(addDays(windowStart, delta));
    }
  }
  if (targets.size === 0) return 0;

  await db.withTransactionAsync(async () => {
    for (const date of targets) {
      await db.runAsync('INSERT OR IGNORE INTO daily_logs (date) VALUES (?)', [date]);
      const log = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM daily_logs WHERE date = ?',
        [date]
      );
      if (!log) continue;
      for (const item of items) {
        await db.runAsync(
          `INSERT INTO daily_log_items (daily_log_id, meal_type, food_id, recipe_id, amount, consumed, sort_order, source_item_id)
           VALUES (?, ?, ?, ?, ?, 0, COALESCE((SELECT MAX(sort_order) + 1 FROM daily_log_items WHERE daily_log_id = ? AND meal_type = ?), 0), ?)`,
          [log.id, options.mealType, item.foodId, item.recipeId, item.amount, log.id, options.mealType, item.id]
        );
      }
    }
  });

  return targets.size;
}
