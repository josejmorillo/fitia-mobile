import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import {
  addItem,
  addRecipeItem,
  getOrCreateDailyLog,
} from './dailyLogService';
import { createFood, type FoodInput } from './foodService';
import { getMeasurements, addMeasurement } from './progressService';
import { getProfile, updateProfile } from './profileService';
import { addIngredient, createRecipe, getRecipes } from './recipeService';
import type { MealType, UserProfile } from '../utils/types';
import { getDatabase } from './database';
import { FOOD_CATEGORIES } from '../utils/constants';

/* ────────────────────────────────────────────────────────────────────
 * Formatos de archivo (JSON)
 * ──────────────────────────────────────────────────────────────────── */

export interface FoodPayload {
  name: string;
  brand: string | null;
  category: string;
  emoji: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface RecipeIngredientPayload {
  food: FoodPayload;
  amount: number;
}

export interface RecipePayload {
  name: string;
  emoji: string;
  ingredients: RecipeIngredientPayload[];
}

export interface MeasurementPayload {
  date: string;
  weight: number | null;
  waist: number | null;
  hips: number | null;
  thighs: number | null;
  biceps: number | null;
  chest: number | null;
}

export interface BackupDayItemPayload {
  mealType: MealType;
  foodName: string | null;
  recipeName: string | null;
  amount: number;
  consumed: boolean;
  sortOrder: number;
}

export interface BackupDayPayload {
  date: string;
  items: BackupDayItemPayload[];
}

export interface BackupPayload {
  foods: FoodPayload[];
  recipes: RecipePayload[];
  days: BackupDayPayload[];
  measurements: MeasurementPayload[];
  profile: UserProfile | null;
}

export type ImportEnvelope =
  | { app: 'nutrifit'; version: 1; kind: 'food'; data: FoodPayload }
  | { app: 'nutrifit'; version: 1; kind: 'recipe'; data: RecipePayload }
  | { app: 'nutrifit'; version: 1; kind: 'backup'; data: BackupPayload };

const VERSION = 1;

export function foodToPayload(
  f: Pick<FoodPayload, 'name' | 'brand' | 'category' | 'emoji'> & {
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  }
): FoodPayload {
  return {
    name: f.name,
    brand: f.brand ?? null,
    category: FOOD_CATEGORIES.includes(f.category) ? f.category : 'Otros',
    emoji: f.emoji || '🍽️',
    caloriesPer100g: f.caloriesPer100g,
    proteinPer100g: f.proteinPer100g,
    carbsPer100g: f.carbsPer100g,
    fatPer100g: f.fatPer100g,
  };
}

export function buildFoodEnvelope(food: FoodPayload): ImportEnvelope {
  return { app: 'nutrifit', version: VERSION, kind: 'food', data: food };
}

export function buildRecipeEnvelope(recipe: RecipePayload): ImportEnvelope {
  return { app: 'nutrifit', version: VERSION, kind: 'recipe', data: recipe };
}

export function buildBackupEnvelope(data: BackupPayload): ImportEnvelope {
  return { app: 'nutrifit', version: VERSION, kind: 'backup', data };
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'archivo';
}

function serialize(envelope: ImportEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

/* ────────────────────────────────────────────────────────────────────
 * Compartir fichero (share sheet → WhatsApp / correo / …)
 * ──────────────────────────────────────────────────────────────────── */

export async function shareJson(envelope: ImportEnvelope, dialogTitle: string): Promise<void> {
  const kind = envelope.kind === 'food' ? 'alimento' : envelope.kind === 'recipe' ? 'receta' : 'backup';
  const name =
    envelope.kind === 'backup'
      ? `nutrifit-backup-${new Date().toISOString().slice(0, 10)}`
      : envelope.data.name;
  const filename = `${kind}-${slugify(name)}.json`;

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.write(serialize(envelope));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle,
      UTI: 'public.json',
    });
  } else {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }
}

/* ────────────────────────────────────────────────────────────────────
 * Lectura de archivos (document picker e intent recibido)
 * ──────────────────────────────────────────────────────────────────── */

export async function readUriText(uri: string): Promise<string> {
  try {
    const file = new File(uri);
    return file.text();
  } catch {
    const legacy = await import('expo-file-system/legacy');
    return legacy.readAsStringAsync(uri);
  }
}

export async function pickJsonFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return readUriText(result.assets[0].uri);
}

/* ────────────────────────────────────────────────────────────────────
 * Importación (con deduplicación por nombre)
 * ──────────────────────────────────────────────────────────────────── */

export interface ImportSummary {
  kind: string;
  label: string;
  created: number;
  skipped: number;
  detail?: string;
}

function isFoodPayload(v: unknown): v is FoodPayload {
  const f = v as FoodPayload;
  return (
    typeof f?.name === 'string' &&
    f.name.trim().length > 0 &&
    typeof f.caloriesPer100g === 'number' &&
    typeof f.proteinPer100g === 'number' &&
    typeof f.carbsPer100g === 'number' &&
    typeof f.fatPer100g === 'number'
  );
}

function isRecipePayload(v: unknown): v is RecipePayload {
  const r = v as RecipePayload;
  return typeof r?.name === 'string' && Array.isArray(r?.ingredients);
}

function isBackupPayload(v: unknown): v is BackupPayload {
  const b = v as BackupPayload;
  return typeof b === 'object' && b != null && Array.isArray((b as BackupPayload).foods);
}

export function parseImportJson(text: string): ImportEnvelope {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  const env = raw as ImportEnvelope;
  if (env?.app !== 'nutrifit' || env.version !== VERSION) {
    throw new Error('El archivo no es un archivo de NutriFit (o es de otra versión).');
  }
  if (env.kind === 'food' && isFoodPayload(env.data)) return env;
  if (env.kind === 'recipe' && isRecipePayload(env.data)) return env;
  if (env.kind === 'backup' && isBackupPayload(env.data)) return env;
  throw new Error('El archivo tiene un formato desconocido.');
}

async function ensureFood(payload: FoodPayload): Promise<number> {
  const existing = await findFoodIdByName(payload.name);
  if (existing != null) return existing;
  const input: FoodInput = {
    name: payload.name.trim(),
    brand: payload.brand ?? null,
    category: payload.category,
    emoji: payload.emoji || '🍽️',
    caloriesPer100g: payload.caloriesPer100g,
    proteinPer100g: payload.proteinPer100g,
    carbsPer100g: payload.carbsPer100g,
    fatPer100g: payload.fatPer100g,
    servingName: null,
    servingAmount: null,
  };
  return createFood(input);
}

async function findFoodIdByName(name: string): Promise<number | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM foods WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1',
    [name]
  );
  return row?.id ?? null;
}

async function findRecipeIdByName(name: string): Promise<number | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM recipes WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1',
    [name]
  );
  return row?.id ?? null;
}

async function importFoodEnvelope(data: FoodPayload): Promise<ImportSummary> {
  const exists = (await findFoodIdByName(data.name)) != null;
  if (!exists) {
    await ensureFood(data);
    return { kind: 'food', label: 'Alimento', created: 1, skipped: 0, detail: data.name };
  }
  return { kind: 'food', label: 'Alimento', created: 0, skipped: 1, detail: data.name };
}

async function importRecipeEnvelope(data: RecipePayload): Promise<ImportSummary> {
  const exists = (await findRecipeIdByName(data.name)) != null;
  if (exists) {
    return { kind: 'recipe', label: 'Receta', created: 0, skipped: 1, detail: data.name };
  }
  let ingredientCount = 0;
  for (const ing of data.ingredients) {
    if (ing?.food && isFoodPayload(ing.food)) {
      await ensureFood(ing.food);
      ingredientCount += 1;
    }
  }
  if (ingredientCount === 0) {
    return { kind: 'recipe', label: 'Receta', created: 0, skipped: 1, detail: `${data.name} (sin ingredientes válidos)` };
  }
  const recipeId = await createRecipe(data.name.trim(), data.emoji || '🍽️');
  for (const ing of data.ingredients) {
    if (!ing?.food || !isFoodPayload(ing.food)) continue;
    const foodId = await ensureFood(ing.food);
    if (typeof ing.amount === 'number' && ing.amount > 0) {
      await addIngredient(recipeId, foodId, ing.amount);
    }
  }
  return { kind: 'recipe', label: 'Receta', created: 1, skipped: 0, detail: data.name };
}

async function importBackupEnvelope(data: BackupPayload): Promise<ImportSummary> {
  const summary: ImportSummary = {
    kind: 'backup',
    label: 'Copia de seguridad',
    created: 0,
    skipped: 0,
    detail: '',
  };

  const nameToId = new Map<string, number>();
  for (const f of data.foods) {
    if (!isFoodPayload(f)) continue;
    const existing = await findFoodIdByName(f.name);
    if (existing != null) {
      nameToId.set(f.name.toLowerCase(), existing);
      summary.skipped += 1;
    } else {
      const id = await ensureFood(f);
      nameToId.set(f.name.toLowerCase(), id);
      summary.created += 1;
    }
  }

  const existingRecipeNames = (await getRecipes()).map((r) => r.name.toLowerCase());
  for (const r of data.recipes) {
    if (!isRecipePayload(r)) continue;
    if (existingRecipeNames.includes(r.name.toLowerCase())) {
      summary.skipped += 1;
      continue;
    }
    const recipeId = await createRecipe(r.name.trim(), r.emoji || '🍽️');
    for (const ing of r.ingredients) {
      if (!ing?.food || !isFoodPayload(ing.food)) continue;
      let foodId = nameToId.get(ing.food.name.toLowerCase()) ?? null;
      if (foodId == null) {
        foodId = await ensureFood(ing.food);
        nameToId.set(ing.food.name.toLowerCase(), foodId);
      }
      if (foodId != null && typeof ing.amount === 'number' && ing.amount > 0) {
        await addIngredient(recipeId, foodId, ing.amount);
      }
    }
    summary.created += 1;
  }

  const db = await getDatabase();
  let daysRestored = 0;
  let daysSkipped = 0;
  for (const day of data.days ?? []) {
    if (!day || typeof day.date !== 'string') continue;
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM daily_logs WHERE date = ?',
      [day.date]
    );
    if (existing) {
      daysSkipped += 1;
      continue;
    }
    const log = await getOrCreateDailyLog(day.date);
    for (const item of day.items ?? []) {
      if (!item) continue;
      if (item.foodName != null) {
        const foodId =
          nameToId.get(String(item.foodName).toLowerCase()) ??
          (await findFoodIdByName(item.foodName));
        if (foodId == null) continue;
        await addItem(log.id, item.mealType, foodId, item.amount ?? 0);
      } else if (item.recipeName != null) {
        const recipeId = await findRecipeIdByName(item.recipeName);
        if (recipeId == null) continue;
        await addRecipeItem(log.id, item.mealType, recipeId, item.amount ?? 0);
      }
    }
    daysRestored += 1;
  }
  summary.detail += `${daysRestored} día(s) restaurado(s), ${daysSkipped} ya existían. `;

  const existingDates = new Set((await getMeasurements()).map((m) => m.date));
  let measurementsImported = 0;
  for (const m of data.measurements ?? []) {
    if (!m || typeof m.date !== 'string' || existingDates.has(m.date)) continue;
    await addMeasurement({
      date: m.date,
      weight: m.weight,
      waist: m.waist,
      hips: m.hips,
      thighs: m.thighs,
      biceps: m.biceps,
      chest: m.chest,
    });
    existingDates.add(m.date);
    measurementsImported += 1;
  }
  summary.detail += `${measurementsImported} medición(es) importada(s).`;

  const profile = data.profile;
  if (profile) {
    const local = await getProfile();
    const isEmpty = local != null && local.weight == null && local.goalCalories == null;
    if (isEmpty) {
      await updateProfile({
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        gender: profile.gender,
        goalCalories: profile.goalCalories,
        goalProtein: profile.goalProtein,
        goalCarbs: profile.goalCarbs,
        goalFat: profile.goalFat,
        calcGoalType: profile.calcGoalType,
        calcActivityLevel: profile.calcActivityLevel,
        calcSpeed: profile.calcSpeed,
      });
    }
  }

  summary.detail = `${summary.created} alimento(s)/receta(s) importado(s), ${summary.skipped} ya existían (se omiten). ${summary.detail ?? ''}`;
  return summary;
}

export async function importFromText(text: string): Promise<string> {
  const envelope = parseImportJson(text);
  let summary: ImportSummary;
  if (envelope.kind === 'food') {
    summary = await importFoodEnvelope(envelope.data);
  } else if (envelope.kind === 'recipe') {
    summary = await importRecipeEnvelope(envelope.data);
  } else {
    summary = await importBackupEnvelope(envelope.data);
  }

  if (summary.kind === 'food' || summary.kind === 'recipe') {
    return summary.created === 1
      ? `✅ ${summary.label} importado: ${summary.detail}`
      : `ℹ️ Ya existía en tu app: ${summary.detail}`;
  }
  return `✅ Copia de seguridad procesada.\n${summary.detail ?? ''}`;
}

/* ────────────────────────────────────────────────────────────────────
 * Compartir recibido desde otra app (WhatsApp / correo / archivos)
 * ──────────────────────────────────────────────────────────────────── */

export async function tryImportIncomingShare(): Promise<string | null> {
  try {
    const payloads = await Sharing.getResolvedSharedPayloadsAsync();
    const file = payloads.find(
      (p) =>
        (p.mimeType ?? '').toLowerCase().includes('json') ||
        (p.originalName ?? '').toLowerCase().endsWith('.json') ||
        p.value.toLowerCase().startsWith('{')
    );
    if (!file) return null;
    Sharing.clearSharedPayloads();
    const uri = file.contentUri ?? file.value;
    if (!uri) return null;
    const text = await readUriText(uri);
    return importFromText(text);
  } catch {
    return null;
  }
}
