export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Food {
  id: number;
  name: string;
  brand: string | null;
  category: string;
  emoji: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingName: string | null;
  servingAmount: number | null;
  createdAt: string;
}

export interface Recipe {
  id: number;
  name: string;
  emoji: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  foodId: number;
  amount: number;
  food?: Food;
}

export interface DailyLog {
  id: number;
  date: string;
  items: DailyLogItem[];
}

export interface DailyLogItem {
  id: number;
  dailyLogId: number;
  mealType: MealType;
  foodId: number | null;
  recipeId: number | null;
  amount: number;
  consumed: boolean;
  sortOrder: number;
  sourceItemId: number | null;
  food?: Food;
  recipe?: Recipe;
}

export interface MacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  id: number;
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  goalCalories: number | null;
  goalProtein: number | null;
  goalCarbs: number | null;
  goalFat: number | null;
  calcGoalType: 'loss' | 'maintenance' | 'gain' | null;
  calcActivityLevel: 'sedentary' | 'light' | 'moderate' | 'very' | 'extra' | null;
  calcSpeed: 'slow' | 'moderate' | 'aggressive' | 'lean' | 'standard' | null;
}

export interface BodyMeasurement {
  id: number;
  date: string;
  weight: number | null;
  waist: number | null;
  hips: number | null;
  thighs: number | null;
  biceps: number | null;
  chest: number | null;
}

export interface ProgressCheckpoint {
  id: number;
  date: string;
  weightKg: number;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  quadricepsCm: number | null;
  notes: string | null;
}

export interface NutritionData {
  name: string | null;
  brand: string | null;
  kcal_100g: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  serving_size_g: number | null;
  serving_name: string | null;
  serving_amount_g: number | null;
  category: string | null;
  emoji: string | null;
}
