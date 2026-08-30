import type { UserProfile } from '../utils/types';
import { getDatabase } from './database';

interface ProfileRow {
  id: number;
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: UserProfile['gender'];
  goalCalories: number | null;
  goalProtein: number | null;
  goalCarbs: number | null;
  goalFat: number | null;
  calcGoalType: UserProfile['calcGoalType'];
  calcActivityLevel: UserProfile['calcActivityLevel'];
  calcSpeed: UserProfile['calcSpeed'];
}

const PROFILE_SELECT = `
  id, weight, height, age, gender,
  goal_calories AS "goalCalories",
  goal_protein AS "goalProtein",
  goal_carbs AS "goalCarbs",
  goal_fat AS "goalFat",
  calc_goal_type AS "calcGoalType",
  calc_activity_level AS "calcActivityLevel",
  calc_speed AS "calcSpeed"
`;

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    weight: row.weight,
    height: row.height,
    age: row.age,
    gender: row.gender,
    goalCalories: row.goalCalories,
    goalProtein: row.goalProtein,
    goalCarbs: row.goalCarbs,
    goalFat: row.goalFat,
    calcGoalType: row.calcGoalType,
    calcActivityLevel: row.calcActivityLevel,
    calcSpeed: row.calcSpeed,
  };
}

export async function getProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProfileRow>(`SELECT ${PROFILE_SELECT} FROM user_profile WHERE id = 1`);
  return row ? mapProfile(row) : null;
}

export async function getOrCreateProfile(): Promise<UserProfile> {
  const existing = await getProfile();
  if (existing) return existing;

  const db = await getDatabase();
  await db.runAsync('INSERT INTO user_profile (id) VALUES (1)');
  const row = await db.getFirstAsync<ProfileRow>(`SELECT ${PROFILE_SELECT} FROM user_profile WHERE id = 1`);
  return mapProfile(row!);
}

export type ProfileInput = Omit<UserProfile, 'id'>;

export async function updateProfile(input: ProfileInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO user_profile
       (id, weight, height, age, gender, goal_calories, goal_protein, goal_carbs, goal_fat, calc_goal_type, calc_activity_level, calc_speed, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       weight = excluded.weight,
       height = excluded.height,
       age = excluded.age,
       gender = excluded.gender,
       goal_calories = excluded.goal_calories,
       goal_protein = excluded.goal_protein,
       goal_carbs = excluded.goal_carbs,
       goal_fat = excluded.goal_fat,
       calc_goal_type = excluded.calc_goal_type,
       calc_activity_level = excluded.calc_activity_level,
       calc_speed = excluded.calc_speed,
       updated_at = datetime('now')`,
    [
      input.weight,
      input.height,
      input.age,
      input.gender,
      input.goalCalories,
      input.goalProtein,
      input.goalCarbs,
      input.goalFat,
      input.calcGoalType,
      input.calcActivityLevel,
      input.calcSpeed,
    ]
  );
}
