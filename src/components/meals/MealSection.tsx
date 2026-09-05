import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';
import { MEAL_LABELS } from '@/utils/constants';
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
  onEdit?: (foodId: number) => void;
  onCopy?: (item: DailyLogItem) => void;
  onRepeat?: (mealType: MealType) => void;
}

interface MiniMacro {
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
  onEdit,
  onCopy,
  onRepeat,
}: MealSectionProps) {
  const mealItems = items.filter((i) => i.mealType === mealType);
  const mealMacros = mealItems.filter((i) => i.consumed).reduce(
    (acc, i) => {
      const m = i.macros ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
      return {
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  const miniMacros: MiniMacro[] = [
    { key: 'P', value: mealMacros.protein, goal: goalProtein, color: colors.protein },
    { key: 'C', value: mealMacros.carbs, goal: goalCarbs, color: colors.carbs },
    { key: 'G', value: mealMacros.fat, goal: goalFat, color: colors.fat },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{MEAL_LABELS[mealType]}</Text>

        <View style={styles.miniBars}>
          {miniMacros.map((m) => {
            const pct = m.goal > 0 ? Math.min((m.value / m.goal) * 100, 100) : 0;
            return (
              <View key={m.key} style={styles.miniBar}>
                <Text style={styles.miniLabel}>
                  <Text style={{ color: m.color, fontWeight: '700' }}>{m.key}</Text>{' '}
                  <Text style={{ color: colors.textTertiary }}>{Math.round(m.value)}g</Text>
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

        {onRepeat && (
          <Pressable style={styles.repeatBtn} onPress={() => onRepeat(mealType)} hitSlop={8}>
            <MaterialIcons name="all-inclusive" size={22} color={colors.primaryDark} />
          </Pressable>
        )}
        <Pressable style={styles.addBtn} onPress={() => onAdd(mealType)} hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.primaryDark} />
        </Pressable>
      </View>

      {mealItems.length === 0 ? (
        <Pressable style={styles.emptyState} onPress={() => onAdd(mealType)}>
          <Text style={styles.emptyText}>
            Agregar alimentos a {MEAL_LABELS[mealType].toLowerCase()}
          </Text>
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
              onEdit={onEdit}
              onCopy={onCopy}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    width: 88,
  },
  miniBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  miniBar: {
    flex: 1,
    gap: 2,
  },
  miniLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  miniTrack: {
    height: 5,
    width: '100%',
    backgroundColor: colors.track,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 9999,
  },
  addBtn: {
    padding: 2,
    marginLeft: 'auto',
  },
  repeatBtn: {
    padding: 2,
  },
  emptyState: {
    padding: 14,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
});
