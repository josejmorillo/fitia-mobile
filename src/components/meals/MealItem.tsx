import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { colors } from '@/utils/colors';
import type { DailyLogItem } from '@/utils/types';

interface MealItemProps {
  item: DailyLogItem;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onAmountPress: (item: DailyLogItem) => void;
  onEdit?: (foodId: number) => void;
  onCopy?: (item: DailyLogItem) => void;
}

export function MealItem({
  item,
  onDelete,
  onToggle,
  onAmountPress,
  onEdit,
  onCopy,
}: MealItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const food = item.food;
  const recipe = item.recipe;
  if (!food && !recipe) return null;

  const macros = item.macros ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const consumed = item.consumed;
  const emoji = food?.emoji ?? recipe?.emoji ?? '🍽️';
  const name = food?.name ?? recipe?.name ?? '';
  const subtitle = food ? food.brand : recipe ? 'Receta' : null;

  return (
    <View style={styles.swipeWrapper}>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={() =>
          onCopy ? (
            <Pressable
              style={styles.copyAction}
              onPress={() => {
                onCopy(item);
                swipeableRef.current?.close();
              }}>
              <Ionicons name="copy-outline" size={18} color="#1A1A1A" />
              <Text style={styles.copyActionText}>Copiar</Text>
            </Pressable>
          ) : null
        }
        overshootLeft={false}>
        <View style={[styles.container, !consumed && styles.notConsumed]}>
          <Pressable style={styles.checkIcon} onPress={() => onToggle(item.id)} hitSlop={8}>
            <Ionicons
              name={consumed ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={consumed ? colors.primary : colors.border}
            />
          </Pressable>

          <View style={styles.iconBox}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {subtitle ? (
                <Text style={styles.brand} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.details}>{Math.round(macros.calories)} kcal • </Text>
              <Pressable onPress={() => onAmountPress(item)}>
                <Text style={styles.amountLink}>{item.amount} g</Text>
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
              {onEdit && food && (
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
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
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
  copyAction: {
    width: 80,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  copyActionText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
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
