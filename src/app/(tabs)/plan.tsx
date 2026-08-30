import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DaySelector } from '@/components/calendar/DaySelector';
import { FoodPickerModal } from '@/components/food/FoodPickerModal';
import { MacroBar } from '@/components/macros/MacroBar';
import { MacroCircle } from '@/components/macros/MacroCircle';
import { AmountModal } from '@/components/meals/AmountModal';
import { MealSection } from '@/components/meals/MealSection';
import {
  addItem,
  copyItemToDate,
  deleteItem,
  getCaloriesByDateRange,
  getDailyLogItems,
  getOrCreateDailyLog,
  toggleItemConsumed,
  updateItemAmount,
} from '@/services/dailyLogService';
import { getOrCreateProfile } from '@/services/profileService';
import { getRecipeIngredients } from '@/services/recipeService';
import { colors } from '@/utils/colors';
import { MEAL_TYPES } from '@/utils/constants';
import { addDays, todayString } from '@/utils/dates';
import { foodMacros, sumMacros } from '@/utils/macros';
import type { DailyLogItem, Food, MealType, Recipe, UserProfile } from '@/utils/types';

export default function PlanScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [logId, setLogId] = useState<number | null>(null);
  const [items, setItems] = useState<DailyLogItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summaries, setSummaries] = useState<Record<string, { consumed: number; goal: number }>>(
    {}
  );
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null);
  const [amountItem, setAmountItem] = useState<DailyLogItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        const prof = await getOrCreateProfile();
        const log = await getOrCreateDailyLog(selectedDate);
        const dayItems = await getDailyLogItems(log.id);
        if (!cancelled) {
          setProfile(prof);
          setLogId(log.id);
          setItems(dayItems);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [selectedDate])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function loadSummaries() {
        const today = todayString();
        const cals = await getCaloriesByDateRange(addDays(today, -14), addDays(today, 14));
        const prof = await getOrCreateProfile();
        const goal = prof.goalCalories ?? 0;
        const sum: Record<string, { consumed: number; goal: number }> = {};
        for (const [date, c] of Object.entries(cals)) {
          sum[date] = { consumed: c, goal };
        }
        if (!cancelled) setSummaries(sum);
      }
      loadSummaries();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  async function reload() {
    if (logId == null) return;
    setItems(await getDailyLogItems(logId));
  }

  async function handleSelectFood(food: Food) {
    if (logId == null || pickerMeal == null) return;
    await addItem(logId, pickerMeal, food.id, 100);
    setPickerMeal(null);
    await reload();
  }

  async function handleSelectRecipe(recipe: Recipe) {
    if (logId == null || pickerMeal == null) return;
    const ingredients = await getRecipeIngredients(recipe.id);
    for (const ing of ingredients) {
      await addItem(logId, pickerMeal, ing.foodId, ing.amount);
    }
    setPickerMeal(null);
    await reload();
  }

  async function handleDelete(id: number) {
    await deleteItem(id);
    await reload();
  }

  async function handleToggle(id: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await toggleItemConsumed(id, !item.consumed);
    await reload();
  }

  async function handleAmountSave(itemId: number, amount: number) {
    await updateItemAmount(itemId, amount);
    setAmountItem(null);
    await reload();
  }

  async function handleCopy(item: DailyLogItem) {
    await copyItemToDate(item.id, addDays(selectedDate, 1));
    await reload();
    ToastAndroid.show('Alimento copiado al día siguiente', ToastAndroid.SHORT);
  }

  const consumedItems = items.filter((i) => i.consumed);
  const totalMacros = sumMacros(
    consumedItems.map((i) =>
      i.food ? foodMacros(i.food, i.amount) : { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  );

  const goalCalories = profile?.goalCalories ?? 0;
  const goalProtein = profile?.goalProtein ?? 0;
  const goalCarbs = profile?.goalCarbs ?? 0;
  const goalFat = profile?.goalFat ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} summaries={summaries} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <MacroCircle caloriesConsumed={totalMacros.calories} caloriesGoal={goalCalories} />
          <View style={styles.bars}>
            <MacroBar
              label="Proteína"
              consumed={totalMacros.protein}
              goal={goalProtein}
              color={colors.protein}
            />
            <MacroBar
              label="Carbohidratos"
              consumed={totalMacros.carbs}
              goal={goalCarbs}
              color={colors.carbs}
            />
            <MacroBar
              label="Grasas"
              consumed={totalMacros.fat}
              goal={goalFat}
              color={colors.fat}
            />
          </View>
        </View>

        {MEAL_TYPES.map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            items={items}
            goalProtein={goalProtein}
            goalCarbs={goalCarbs}
            goalFat={goalFat}
            onAdd={setPickerMeal}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onAmountPress={setAmountItem}
            onEdit={(foodId) =>
              router.push({ pathname: '/food/[id]', params: { id: String(foodId) } })
            }
            onCopy={handleCopy}
          />
        ))}
      </ScrollView>

      <FoodPickerModal
        visible={pickerMeal != null}
        onClose={() => setPickerMeal(null)}
        onSelect={handleSelectFood}
        onSelectRecipe={handleSelectRecipe}
      />
      <AmountModal
        item={amountItem}
        onClose={() => setAmountItem(null)}
        onSave={handleAmountSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  bars: {
    flex: 1,
    gap: 8,
  },
});
