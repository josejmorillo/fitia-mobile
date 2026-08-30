import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';
import { foodMacros } from '@/utils/macros';
import type { DailyLogItem } from '@/utils/types';

interface MealItemProps {
  item: DailyLogItem;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

export function MealItem({ item, onDelete, onToggle }: MealItemProps) {
  const food = item.food;
  if (!food) return null;

  const macros = foodMacros(food, item.amount);
  const name = item.consumed ? food.name : `${food.name} (pendiente)`;

  return (
    <Pressable
      style={[styles.container, !item.consumed && styles.containerPending]}
      onPress={() => onToggle(item.id)}>
      <Text style={styles.emoji}>{food.emoji}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, !item.consumed && styles.namePending]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.macros}>
          {item.amount} g · P {macros.protein} · C {macros.carbs} · G {macros.fat}
        </Text>
      </View>
      <Text style={styles.kcal}>{macros.calories} kcal</Text>
      <Pressable
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  containerPending: {
    opacity: 0.55,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  namePending: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  macros: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  kcal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  deleteBtn: {
    padding: 2,
  },
});
