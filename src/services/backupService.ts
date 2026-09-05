import type { BackupPayload, FoodPayload, MeasurementPayload, RecipePayload } from './shareService';
import { buildBackupEnvelope, foodToPayload, shareJson } from './shareService';
import { getDatabase } from './database';
import { getDailyLogItems, getOrCreateDailyLog } from './dailyLogService';
import { getAllFoods } from './foodService';
import { getMeasurements } from './progressService';
import { getProfile } from './profileService';
import { getRecipeIngredients, getRecipes } from './recipeService';

export async function exportBackup(): Promise<void> {
  const foods = await getAllFoods();

  const recipesAll = await getRecipes();
  const recipes: RecipePayload[] = [];
  for (const r of recipesAll) {
    const ingredients = await getRecipeIngredients(r.id);
    recipes.push({
      name: r.name,
      emoji: r.emoji,
      ingredients: ingredients
        .filter((i) => i.food)
        .map((i) => ({ food: foodToPayload(i.food!), amount: i.amount })),
    });
  }

  const measurements: MeasurementPayload[] = (await getMeasurements()).map((m) => ({
    date: m.date,
    weight: m.weight,
    waist: m.waist,
    hips: m.hips,
    thighs: m.thighs,
    biceps: m.biceps,
    chest: m.chest,
  }));

  const profile = await getProfile();

  const db = await getDatabase();
  const logRows = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM daily_logs ORDER BY date'
  );
  const days: BackupPayload['days'] = [];
  for (const { date } of logRows) {
    const log = await getOrCreateDailyLog(date);
    const items = await getDailyLogItems(log.id);
    days.push({
      date,
      items: items
        .filter((i) => i.food)
        .map((i) => ({
          mealType: i.mealType,
          foodName: i.food!.name,
          amount: i.amount,
          consumed: i.consumed,
          sortOrder: i.sortOrder,
        })),
    });
  }

  const foodsPayload: FoodPayload[] = foods.map(foodToPayload);
  const payload: BackupPayload = {
    foods: foodsPayload,
    recipes,
    days,
    measurements,
    profile,
  };

  await shareJson(buildBackupEnvelope(payload), 'Compartir copia de seguridad de NutriFit');
}
