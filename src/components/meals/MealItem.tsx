import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useIsActive, useReorderableDrag } from 'react-native-reorderable-list';

import { colors } from '@/utils/colors';
import { foodMacros, scaleMacros } from '@/utils/macros';
import { calcCarbRations, formatRations } from '@/utils/rations';
import { useHoldRepeat } from '@/utils/useHoldRepeat';
import type { DailyLogItem } from '@/utils/types';

interface MealItemProps {
  item: DailyLogItem;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onAmountPress: (item: DailyLogItem) => void;
  onEdit?: (item: DailyLogItem) => void;
  onCopy?: (item: DailyLogItem) => void;
  onQuickAmount?: (item: DailyLogItem, delta: number) => void;
  showRations?: boolean;
  gramsPerRation?: number;
}

export function MealItem({
  item,
  onDelete,
  onToggle,
  onAmountPress,
  onEdit,
  onCopy,
  onQuickAmount,
  showRations = false,
  gramsPerRation,
}: MealItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const drag = useReorderableDrag();
  const isDragging = useIsActive();
  const [expanded, setExpanded] = useState(false);
  const decAmount = useHoldRepeat(() => onQuickAmount?.(item, -5));
  const incAmount = useHoldRepeat(() => onQuickAmount?.(item, 5));
  const food = item.food;
  const recipe = item.recipe;
  if (!food && !recipe) return null;

  const macros = item.macros ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const rationLabel =
    showRations && gramsPerRation && gramsPerRation > 0
      ? ` (${formatRations(calcCarbRations(macros.carbs, gramsPerRation))} R)`
      : '';
  const consumed = item.consumed;
  const emoji = food?.emoji ?? recipe?.emoji ?? '🍽️';
  const name = food?.name ?? recipe?.name ?? '';
  const canExpand = !!recipe && recipe.ingredients.length > 0 && recipe.totalGrams > 0;
  const subtitle = food
    ? food.brand
    : recipe
      ? canExpand
        ? `Receta · ${recipe.ingredients.length} ingredientes`
        : 'Receta'
      : null;

  let amountLabel = `${item.amount} g`;
  if (food?.servingName && food.servingAmount) {
    const units = Math.round((item.amount / food.servingAmount) * 100) / 100;
    amountLabel = `${units} ${food.servingName} (${item.amount} g)`;
  }

  return (
    <View style={[isDragging && styles.draggingWrapper]}>
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
          <Pressable
            style={[
              styles.container,
              !consumed && styles.notConsumed,
              isDragging && styles.draggingContainer,
            ]}
            onLongPress={drag}
            delayLongPress={200}>
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
                <View style={styles.nameLine}>
                  <Text style={styles.name} numberOfLines={2}>
                    {name}
                  </Text>
                  {canExpand && (
                    <Pressable onPress={() => setExpanded((e) => !e)} hitSlop={8}>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  )}
                </View>
                {subtitle ? (
                  <Text style={styles.brand} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.details}>{Math.round(macros.calories)} kcal</Text>
                {onQuickAmount ? (
                  <View style={styles.quickAmount}>
                    <Pressable
                      style={styles.quickBtn}
                      onPressIn={decAmount.start}
                      onPressOut={decAmount.stop}
                      hitSlop={6}>
                      <Ionicons name="remove" size={12} color={colors.primaryDark} />
                    </Pressable>
                    <Pressable onPress={() => onAmountPress(item)} hitSlop={4}>
                      <Text style={styles.amountLink}>{item.amount} g</Text>
                    </Pressable>
                    <Pressable
                      style={styles.quickBtn}
                      onPressIn={incAmount.start}
                      onPressOut={incAmount.stop}
                      hitSlop={6}>
                      <Ionicons name="add" size={12} color={colors.primaryDark} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={() => onAmountPress(item)}>
                    <Text style={styles.amountLink}>{amountLabel}</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.right}>
              <View style={styles.macros}>
                <Text style={[styles.macro, { color: colors.protein }]}>{Math.round(macros.protein)}P</Text>
                <Text style={[styles.macro, { color: colors.carbs }]}>{Math.round(macros.carbs)}C{rationLabel}</Text>
                <Text style={[styles.macro, { color: colors.fat }]}>{Math.round(macros.fat)}G</Text>
              </View>
              <View style={styles.actionButtons}>
                {onEdit && (food || recipe) && (
                  <Pressable style={styles.editBtn} onPress={() => onEdit(item)} hitSlop={6}>
                    <Ionicons name="create-outline" size={15} color="#007AFF" />
                  </Pressable>
                )}
                <Pressable style={styles.deleteBtn} onPress={() => onDelete(item.id)} hitSlop={6}>
                  <Ionicons name="trash-outline" size={15} color="#ff4d4d" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Swipeable>
      </View>

      {canExpand && expanded && recipe && (
        <View style={styles.ingredientsCard}>
          {recipe.ingredients.map((ing) => {
            const ingFood = ing.food;
            if (!ingFood) return null;
            const full = foodMacros(ingFood, ing.amount);
            const scaled = scaleMacros(full, recipe.totalGrams, item.amount);
            const grams = Math.round((ing.amount * item.amount) / recipe.totalGrams);
            const ration =
              showRations && gramsPerRation && gramsPerRation > 0
                ? formatRations(calcCarbRations(scaled.carbs, gramsPerRation))
                : null;
            return (
              <View key={ing.id} style={styles.ingredientRow}>
                <Text style={styles.ingredientEmoji}>{ingFood.emoji}</Text>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName} numberOfLines={1}>
                    {ingFood.name}
                  </Text>
                  <Text style={styles.ingredientGrams}>
                    {grams} g{ration ? ` · ${ration} R` : ''}
                  </Text>
                </View>
                <View style={styles.ingredientMacros}>
                  <Text style={[styles.ingredientMacro, { color: colors.protein }]}>
                    {Math.round(scaled.protein)}P
                  </Text>
                  <Text style={[styles.ingredientMacro, { color: colors.carbs }]}>
                    {Math.round(scaled.carbs)}C
                  </Text>
                  <Text style={[styles.ingredientMacro, { color: colors.fat }]}>
                    {Math.round(scaled.fat)}G
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  swipeWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  draggingWrapper: {
    transform: [{ scale: 1.02 }],
    zIndex: 10,
  },
  draggingContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#FFF9DB',
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
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  brand: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  quickAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickBtn: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
  ingredientsCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
    marginTop: 6,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 44,
  },
  ingredientEmoji: {
    fontSize: 14,
    width: 18,
    textAlign: 'center',
  },
  ingredientInfo: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  ingredientName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  ingredientGrams: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  ingredientMacros: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 0,
  },
  ingredientMacro: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
});
