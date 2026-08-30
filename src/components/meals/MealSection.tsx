import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';
import { MEAL_EMOJIS, MEAL_LABELS } from '@/utils/constants';
import { foodMacros, sumMacros } from '@/utils/macros';
import type { DailyLogItem, MealType } from '@/utils/types';
import { MealItem } from './MealItem';

interface MealSectionProps {
  mealType: MealType;
  items: DailyLogItem[];
  onAdd: (mealType: MealType) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

export function MealSection({ mealType, items, onAdd, onDelete, onToggle }: MealSectionProps) {
  const mealItems = items.filter((i) => i.mealType === mealType);
  const mealMacros = sumMacros(
    mealItems.map((i) => (i.food ? foodMacros(i.food, i.amount) : { calories: 0, protein: 0, carbs: 0, fat: 0 }))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {MEAL_EMOJIS[mealType]} {MEAL_LABELS[mealType]}
        </Text>
        <Text style={styles.kcal}>{mealMacros.calories} kcal</Text>
        <Pressable style={styles.addBtn} onPress={() => onAdd(mealType)} hitSlop={8}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {mealItems.length === 0 ? (
        <Text style={styles.empty}>Sin alimentos</Text>
      ) : (
        <View style={styles.list}>
          {mealItems.map((item) => (
            <MealItem key={item.id} item={item} onDelete={onDelete} onToggle={onToggle} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  kcal: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  addBtn: {
    padding: 2,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  list: {
    gap: 8,
  },
});
