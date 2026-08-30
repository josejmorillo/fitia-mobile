import * as SQLite from 'expo-sqlite';

const DB_NAME = 'fitia.db';
const CURRENT_VERSION = 1;

const MIGRATIONS: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      emoji TEXT,
      calories_per_100g REAL NOT NULL,
      protein_per_100g REAL NOT NULL,
      carbs_per_100g REAL NOT NULL,
      fat_per_100g REAL NOT NULL,
      serving_name TEXT,
      serving_amount REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipe_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      food_id INTEGER NOT NULL REFERENCES foods(id),
      amount REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_log_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snacks')),
      food_id INTEGER REFERENCES foods(id),
      recipe_id INTEGER REFERENCES recipes(id),
      amount REAL NOT NULL,
      consumed INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      source_item_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight REAL,
      waist REAL,
      hips REAL,
      thighs REAL,
      biceps REAL,
      chest REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS progress_checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      chest_cm REAL,
      waist_cm REAL,
      hips_cm REAL,
      biceps_cm REAL,
      quadriceps_cm REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      weight REAL,
      height REAL,
      age INTEGER,
      gender TEXT,
      goal_calories INTEGER,
      goal_protein INTEGER,
      goal_carbs INTEGER,
      goal_fat INTEGER,
      calc_goal_type TEXT,
      calc_activity_level TEXT,
      calc_speed TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < CURRENT_VERSION) {
    await db.execAsync('PRAGMA foreign_keys = ON');
    for (let v = currentVersion + 1; v <= CURRENT_VERSION; v++) {
      if (MIGRATIONS[v]) {
        await db.execAsync(MIGRATIONS[v]);
      }
    }
    await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION}`);
  }

  return db;
}
