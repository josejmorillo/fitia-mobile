import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DaySelector } from '@/components/calendar/DaySelector';
import { FoodPickerModal } from '@/components/food/FoodPickerModal';
import { MealSection } from '@/components/meals/MealSection';
import {
  addItem,
  deleteItem,
  getDailyLogItems,
  getOrCreateDailyLog,
  toggleItemConsumed,
} from '@/services/dailyLogService';
import { colors } from '@/utils/colors';
import { MEAL_TYPES } from '@/utils/constants';
import { formatLongDate, todayString } from '@/utils/dates';
import { foodMacros, sumMacros } from '@/utils/macros';
import type { DailyLogItem, Food, MealType } from '@/utils/types';

export default function PlanScreen() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [logId, setLogId] = useState<number | null>(null);
  const [items, setItems] = useState<DailyLogItem[]>([]);
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadDay() {
      const log = await getOrCreateDailyLog(selectedDate);
      const dayItems = await getDailyLogItems(log.id);
      if (!cancelled) {
        setLogId(log.id);
        setItems(dayItems);
      }
    }
    loadDay();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

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

  const totalMacros = sumMacros(
    items.map((i) =>
      i.food
        ? foodMacros(i.food, i.amount)
        : { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} />

      <View style={styles.summary}>
        <Text style={styles.dateLabel}>{formatLongDate(selectedDate)}</Text>
        <View style={styles.macroRow}>
          <Text style={styles.totalKcal}>{totalMacros.calories}</Text>
          <Text style={styles.kcalUnit}> kcal</Text>
          <Text style={styles.macrosText}>
            P {totalMacros.protein}g · C {totalMacros.carbs}g · G {totalMacros.fat}g
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {MEAL_TYPES.map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            items={items}
            onAdd={setPickerMeal}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        ))}
      </ScrollView>

      <FoodPickerModal
        visible={pickerMeal != null}
        onClose={() => setPickerMeal(null)}
        onSelect={handleSelectFood}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  totalKcal: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  kcalUnit: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  macrosText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
