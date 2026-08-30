export type Gender = 'male' | 'female' | 'other';
export type GoalType = 'loss' | 'maintenance' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
export type SpeedType = 'slow' | 'moderate' | 'aggressive' | 'lean' | 'standard';

export interface CalculatorInputs {
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  goalType: GoalType;
  activityLevel: ActivityLevel;
  speed?: SpeedType;
  bodyFat?: number;
}

export interface CalculatorOutputs {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  deficitSurplus: number;
  projectedWeightChange: number;
  warnings: string[];
}

export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number => {
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }
  return Math.round(bmr);
};

export const getActivityMultiplier = (level: ActivityLevel): number => {
  switch (level) {
    case 'sedentary':
      return 1.2;
    case 'light':
      return 1.375;
    case 'moderate':
      return 1.55;
    case 'very':
      return 1.725;
    case 'extra':
      return 1.9;
    default:
      return 1.2;
  }
};

const getCalorieAdjustmentAndWeightChange = (
  goalType: GoalType,
  speed?: SpeedType
): { adj: number; weightChange: number } => {
  if (goalType === 'loss') {
    switch (speed) {
      case 'slow':
        return { adj: -300, weightChange: -0.3 };
      case 'aggressive':
        return { adj: -500, weightChange: -0.5 };
      case 'moderate':
      default:
        return { adj: -400, weightChange: -0.4 };
    }
  } else if (goalType === 'gain') {
    switch (speed) {
      case 'standard':
        return { adj: 350, weightChange: 0.4 };
      case 'lean':
      default:
        return { adj: 200, weightChange: 0.25 };
    }
  }
  return { adj: 0, weightChange: 0 };
};

export const calculateGoals = (inputs: CalculatorInputs): CalculatorOutputs => {
  const warnings: string[] = [];
  const bmr = calculateBMR(inputs.weight, inputs.height, inputs.age, inputs.gender);
  const tdee = Math.round(bmr * getActivityMultiplier(inputs.activityLevel));

  const { adj, weightChange } = getCalorieAdjustmentAndWeightChange(
    inputs.goalType,
    inputs.speed
  );

  let targetCalories = tdee + adj;

  if (inputs.gender === 'female' && targetCalories < 1200) {
    targetCalories = 1200;
    warnings.push('Las calorías se han ajustado al mínimo recomendado de 1200 kcal para mujeres.');
  } else if (inputs.gender !== 'female' && targetCalories < 1400) {
    targetCalories = 1400;
    warnings.push('Las calorías se han ajustado al mínimo recomendado de 1400 kcal para hombres.');
  }

  targetCalories = Math.round(targetCalories / 5) * 5;

  const appliedDiff = targetCalories - tdee;

  const leanMass = inputs.bodyFat
    ? inputs.weight * (1 - inputs.bodyFat / 100)
    : inputs.weight;

  let proteinGKg = 1.8;
  let fatPercentage = 0.25;

  if (inputs.goalType === 'loss') {
    proteinGKg = 2.2;
    fatPercentage = 0.25;
  } else if (inputs.goalType === 'gain') {
    proteinGKg = 2.0;
    fatPercentage = 0.3;
  } else if (inputs.goalType === 'maintenance') {
    proteinGKg = 1.8;
    fatPercentage = 0.25;
  }

  const proteinGrams = Math.round(leanMass * proteinGKg);
  const proteinCalories = proteinGrams * 4;

  const fatCalories = targetCalories * fatPercentage;
  const fatGrams = Math.round(fatCalories / 9);

  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.max(0, Math.round(remainingCalories / 4));

  return {
    bmr,
    tdee,
    targetCalories,
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
    deficitSurplus: appliedDiff,
    projectedWeightChange: weightChange,
    warnings,
  };
};
