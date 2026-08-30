import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';
import { foodMacros } from '@/utils/macros';
import type { DailyLogItem } from '@/utils/types';

interface MealItemProps {
  item: DailyLogItem;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onAmountPress: (item: DailyLogItem) => void;
  onEdit?: (foodId: number) => void;
}

export function MealItem({ item, onDelete, onToggle, onAmountPress, onEdit }: MealItemProps) {
  const food = item.food;
  if (!food) return null;

  const macros = foodMacros(food, item.amount);
  const consumed = item.consumed;

  return (
    <View style={[styles.container, !consumed && styles.notConsumed]}>
      <Pressable style={styles.checkIcon} onPress={() => onToggle(item.id)} hitSlop={8}>
        <Ionicons
          name={consumed ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={consumed ? colors.primary : colors.border}
        />
      </Pressable>

      <View style={styles.iconBox}>
        <Text style={styles.emoji}>{food.emoji}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {food.name}
          </Text>
          {food.brand ? (
            <Text style={styles.brand} numberOfLines={1}>
              {food.brand}
            </Text>
          ) : null}
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.details}>{Math.round(macros.calories)} kcal • </Text>
          <Pressable onPress={() => onAmountPress(item)}>
            <Text style={styles.amountLink}>
              {item.amount} g
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.macros}>
          <Text style={[styles.macro, { color: colors.protein }]}>{Math.round(macros.protein)}P</Text>
          <Text style={[styles.macro, { color: colors.carbs }]}>{Math.round(macros.carbs)}C</Text>
          <Text style={[styles.macro, { color: colors.fat }]}>{Math.round(macros.fat)}G</Text>
        </View>
        <View style={styles.actionButtons}>
          {onEdit && (
            <Pressable style={styles.editBtn} onPress={() => onEdit(food.id)} hitSlop={6}>
              <Ionicons name="pencil-outline" size={15} color="#007AFF" />
            </Pressable>
          )}
          <Pressable style={styles.deleteBtn} onPress={() => onDelete(item.id)} hitSlop={6}>
            <Ionicons name="trash-outline" size={15} color="#ff4d4d" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderRadius: 10,
  },
  notConsumed: {
    opacity: 0.6,
  },
  checkIcon: {
    flexShrink: 0,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    gap: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  brand: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  details: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  amountLink: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  macros: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 0,
  },
  macro: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  editBtn: {
    padding: 2,
  },
  deleteBtn: {
    padding: 2,
  },
});
