import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

import { FOOD_CATEGORIES } from '../utils/constants';
import {
  importBackupEnvelope,
  type BackupPayload,
  type FoodPayload,
  type RecipeIngredientPayload,
  type RecipePayload,
} from './shareService';

/* ────────────────────────────────────────────────────────────────────
 * Importación de una base de datos SQLite de la app web
 * ──────────────────────────────────────────────────────────────────── */

const CATEGORY_RENAMES: Record<string, string> = {
  Cereales: 'Cereales y Legumbres',
  Lácteos: 'Lácteos y Derivados',
  'Panes y masas': 'Panadería',
  Verduras: 'Verduras y Tubérculos',
  'Open Food Facts': 'Otros',
};

function normalizeCategory(raw: string | null): string {
  const cat = (raw ?? '').trim();
  if (!cat) return 'Otros';
  const renamed = CATEGORY_RENAMES[cat] ?? cat;
  return FOOD_CATEGORIES.includes(renamed) ? renamed : 'Otros';
}

interface WebFoodRow {
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
}

interface WebMealRow {
  id: number;
  name: string;
  emoji: string | null;
}

interface WebMealFoodRow {
  mealId: number;
  foodId: number;
  amount: number;
}

function toFoodPayload(row: WebFoodRow): FoodPayload {
  const servingName = row.servingName?.trim();
  return {
    name: row.name,
    brand: row.brand ?? null,
    category: normalizeCategory(row.category),
    emoji: row.emoji?.trim() || '🍽️',
    caloriesPer100g: row.caloriesPer100g,
    proteinPer100g: row.proteinPer100g,
    carbsPer100g: row.carbsPer100g,
    fatPer100g: row.fatPer100g,
    servingName: servingName ? servingName : null,
    servingAmount: row.servingAmount ?? null,
  };
}

interface OpenResult {
  db: SQLite.SQLiteDatabase;
  tempFile: string | null;
}

async function openWebDatabase(uri: string): Promise<OpenResult> {
  let deserializeError: unknown = null;

  try {
    const buffer = await new File(uri).arrayBuffer();
    const db = await SQLite.deserializeDatabaseAsync(new Uint8Array(buffer));
    return { db, tempFile: null };
  } catch (err) {
    deserializeError = err;
  }

  try {
    const dir = FileSystem.documentDirectory;
    if (!dir) throw new Error('directorio de documentos no disponible');
    const fileName = `import-web-${Date.now()}.sqlite`;
    const dest = `${dir}${fileName}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    const db = await SQLite.openDatabaseAsync(fileName, {}, dir);
    return { db, tempFile: dest };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const first = deserializeError instanceof Error ? deserializeError.message : String(deserializeError);
    throw new Error(`No se pudo abrir la base de datos (${detail} · deserialize: ${first})`);
  }
}

export async function importWebDatabase(uri: string): Promise<string> {
  const { db, tempFile } = await openWebDatabase(uri);

  try {
    let foods: WebFoodRow[];
    let meals: WebMealRow[];
    let mealFoods: WebMealFoodRow[];
    try {
      foods = await db.getAllAsync<WebFoodRow>(
        `SELECT
           id, name, brand, category, emoji,
           calories_per_100g AS "caloriesPer100g",
           protein_per_100g AS "proteinPer100g",
           carbs_per_100g AS "carbsPer100g",
           fat_per_100g AS "fatPer100g",
           serving_name AS "servingName",
           serving_amount AS "servingAmount"
         FROM foods`
      );
      meals = await db.getAllAsync<WebMealRow>('SELECT id, name, emoji FROM custom_meals');
      mealFoods = await db.getAllAsync<WebMealFoodRow>(
        'SELECT custom_meal_id AS "mealId", food_id AS "foodId", amount FROM custom_meal_foods'
      );
    } catch {
      throw new Error(
        'El archivo no tiene el formato esperado (faltan las tablas de alimentos y recetas).'
      );
    }

    const foodById = new Map(foods.map((f) => [f.id, f]));

    const payloadFoods: FoodPayload[] = foods.map(toFoodPayload);

    const recipes: RecipePayload[] = [];
    for (const meal of meals) {
      const ingredients = mealFoods
        .filter((mf) => mf.mealId === meal.id)
        .map((mf): RecipeIngredientPayload | null => {
          const food = foodById.get(mf.foodId);
          return food ? { food: toFoodPayload(food), amount: mf.amount } : null;
        })
        .filter((ing): ing is RecipeIngredientPayload => ing != null);
      if (ingredients.length > 0) {
        recipes.push({ name: meal.name, emoji: meal.emoji?.trim() || '🍽️', ingredients });
      }
    }

    if (payloadFoods.length === 0) {
      throw new Error('La base de datos no contiene alimentos.');
    }

    const payload: BackupPayload = {
      foods: payloadFoods,
      recipes,
      days: [],
      measurements: [],
      profile: null,
    };

    const summary = await importBackupEnvelope(payload);
    const newOnes = summary.created;
    const existing = summary.skipped;
    return `✅ Importación completada: ${newOnes} alimento(s)/receta(s) nuevos, ${existing} ya existían (se omiten).`;
  } finally {
    await db.closeAsync();
    if (tempFile) {
      await FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(() => {});
      await FileSystem.deleteAsync(`${tempFile}-wal`, { idempotent: true }).catch(() => {});
      await FileSystem.deleteAsync(`${tempFile}-shm`, { idempotent: true }).catch(() => {});
    }
  }
}
