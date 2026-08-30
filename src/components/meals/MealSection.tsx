import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';
import { MEAL_EMOJIS, MEAL_LABELS } from '@/utils/constants';
import { foodMacros } from '@/utils/macros';
import type { DailyLogItem, MealType } from '@/utils/types';
import { MealItem } from './MealItem';

interface MealSectionProps {
  mealType: MealType;
  items: DailyLogItem[];
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  onAdd: (mealType: MealType) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onAmountPress: (item: DailyLogItem) => void;
}

interface MiniBarData {
  key: 'P' | 'C' | 'G';
  value: number;
  goal: number;
  color: string;
}

export function MealSection({
  mealType,
  items,
  goalProtein,
  goalCarbs,
  goalFat,
  onAdd,
  onDelete,
  onToggle,
  onAmountPress,
}: MealSectionProps) {
  const mealItems = items.filter((i) => i.mealType === mealType);
  const mealMacros = mealItems
    .filter((i) => i.consumed && i.food)
    .reduce(
      (acc, i) => {
        const m = foodMacros(i.food!, i.amount);
        return {
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          carbs: acc.carbs + m.carbs,
          fat: acc.fat + m.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const miniBars: MiniBarData[] = [
    { key: 'P', value: mealMacros.protein, goal: goalProtein, color: colors.protein },
    { key: 'C', value: mealMacros.carbs, goal: goalCarbs, color: colors.carbs },
    { key: 'G', value: mealMacros.fat, goal: goalFat, color: colors.fat },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            {MEAL_EMOJIS[mealType]} {MEAL_LABELS[mealType]}
          </Text>
          <View style={styles.miniBars}>
            {miniBars.map((m) => {
              const pct = m.goal > 0 ? Math.min((m.value / m.goal) * 100, 100) : 0;
              return (
                <View key={m.key} style={styles.miniBar}>
                  <Text style={styles.miniBarLabel}>
                    {Math.round(pct)}% {m.key}
                  </Text>
                  <View style={styles.miniTrack}>
                    <View
                      style={[styles.miniFill, { width: `${pct}%`, backgroundColor: m.color }]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        <Pressable style={styles.addBtn} onPress={() => onAdd(mealType)} hitSlop={8}>
          <Ionicons name="add" size={24} color={colors.primaryDark} />
        </Pressable>
      </View>

      {mealItems.length === 0 ? (
        <Pressable style={styles.emptyState} onPress={() => onAdd(mealType)}>
          <Text style={styles.emptyText}>Agregar alimentos a {MEAL_LABELS[mealType].toLowerCase()}</Text>
        </Pressable>
      ) : (
        <View style={styles.list}>
          {mealItems.map((item) => (
            <MealItem
              key={item.id}
              item={item}
              onDelete={onDelete}
              onToggle={onToggle}
              onAmountPress={onAmountPress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginBottom: 8,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  miniBars: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  miniBar: {
    flex: 1,
    gap: 2,
  },
  miniTrack: {
    height: 6,
    width: '100%',
    backgroundColor: colors.track,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  miniBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    textAlign: 'right',
  },
  miniFill: {
    height: '100%',
    borderRadius: 9999,
  },
  addBtn: {
    padding: 4,
    marginLeft: 8,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
});
