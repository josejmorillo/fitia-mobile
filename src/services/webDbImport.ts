import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

import { FOOD_CATEGORIES } from '../utils/constants';
import {
  importBackupEnvelope,
  readUriAsUint8Array,
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

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += BASE64_ALPHABET[b0 >> 2];
    out += BASE64_ALPHABET[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? BASE64_ALPHABET[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? BASE64_ALPHABET[b2 & 63] : '=';
  }
  return out;
}

async function openWebDatabase(uri: string): Promise<OpenResult> {
  const bytes = await readUriAsUint8Array(uri);

  try {
    const db = await SQLite.deserializeDatabaseAsync(bytes);
    return { db, tempFile: null };
  } catch (deserializeError) {
    try {
      const dir = FileSystem.documentDirectory;
      if (!dir) throw new Error('directorio de documentos no disponible');
      const fileName = `import-web-${Date.now()}.sqlite`;
      const dest = `${dir}${fileName}`;
      await FileSystem.writeAsStringAsync(dest, uint8ArrayToBase64(bytes), {
        encoding: FileSystem.EncodingType.Base64,
      });
      const db = await SQLite.openDatabaseAsync(fileName, {}, dir);
      return { db, tempFile: dest };
    } catch (openError) {
      const first = deserializeError instanceof Error ? deserializeError.message : String(deserializeError);
      const second = openError instanceof Error ? openError.message : String(openError);
      throw new Error(`No se pudo abrir la base de datos (${second} · deserialize: ${first})`);
    }
  }
}

export async function readWebDatabasePayload(uri: string): Promise<BackupPayload> {
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

    return {
      foods: payloadFoods,
      recipes,
      days: [],
      measurements: [],
      profile: null,
    };
  } finally {
    await db.closeAsync();
    if (tempFile) {
      await FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(() => {});
      await FileSystem.deleteAsync(`${tempFile}-wal`, { idempotent: true }).catch(() => {});
      await FileSystem.deleteAsync(`${tempFile}-shm`, { idempotent: true }).catch(() => {});
    }
  }
}

/** Importa directamente (sin previsualización) la BD web completa. */
export async function importWebDatabase(uri: string): Promise<string> {
  const payload = await readWebDatabasePayload(uri);
  const summary = await importBackupEnvelope(payload);
  return `✅ Importación completada: ${summary.created} alimento(s)/receta(s) nuevos, ${summary.skipped} ya existían (se omiten).`;
}
