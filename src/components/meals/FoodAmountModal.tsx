import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/utils/colors';
import { foodMacros } from '@/utils/macros';
import type { Food } from '@/utils/types';

interface FoodAmountModalProps {
  food: Food | null;
  onClose: () => void;
  onConfirm: (grams: number) => void;
}

type Unit = 'units' | 'g';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FoodAmountModal({ food, onClose, onConfirm }: FoodAmountModalProps) {
  const servingGrams = food?.servingAmount ?? null;
  const unitLabel = food?.servingName ? capitalize(food.servingName) : 'Unidades';

  const [unit, setUnit] = useState<Unit>('g');
  const [amount, setAmount] = useState('100');
  const [wasVisible, setWasVisible] = useState(false);

  if (food && !wasVisible) {
    setWasVisible(true);
    if (servingGrams) {
      setUnit('units');
      setAmount('1');
    } else {
      setUnit('g');
      setAmount('100');
    }
  } else if (!food && wasVisible) {
    setWasVisible(false);
  }

  const parsed = parseFloat(amount.replace(',', '.'));
  const quantity = isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  const grams = unit === 'units' && servingGrams ? quantity * servingGrams : quantity;
  const macros = food && grams > 0 ? foodMacros(food, grams) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <Modal visible={food != null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          {food && (
            <>
              <View style={styles.header}>
                <Text style={styles.emoji}>{food.emoji}</Text>
                <View style={styles.headerInfo}>
                  <Text style={styles.title} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <Text style={styles.subtitle}>
                    {food.caloriesPer100g} kcal · P {food.proteinPer100g} · C {food.carbsPer100g} · G{' '}
                    {food.fatPer100g} /100g
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              {servingGrams ? (
                <View style={styles.segmented}>
                  <Pressable
                    style={[styles.segment, unit === 'units' && styles.segmentActive]}
                    onPress={() => setUnit('units')}>
                    <Text
                      style={[styles.segmentText, unit === 'units' && styles.segmentTextActive]}>
                      {unitLabel}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.segment, unit === 'g' && styles.segmentActive]}
                    onPress={() => setUnit('g')}>
                    <Text style={[styles.segmentText, unit === 'g' && styles.segmentTextActive]}>
                      Gramos
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.amountRow}>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={styles.unitLabel}>
                  {unit === 'units' ? (food.servingName ?? 'unidades') : 'g'}
                </Text>
              </View>

              {unit === 'units' && servingGrams ? (
                <Text style={styles.hint}>Equivale a {Math.round(quantity * servingGrams)} g</Text>
              ) : null}

              <View style={styles.preview}>
                <Text style={styles.previewCalories}>{macros.calories} kcal</Text>
                <Text style={styles.previewMacros}>
                  P {macros.protein}g · C {macros.carbs}g · G {macros.fat}g
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.confirmBtn, grams <= 0 && styles.btnDisabled]}
                  onPress={() => onConfirm(grams)}
                  disabled={grams <= 0}>
                  <Text style={styles.confirmText}>Añadir</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  emoji: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 90,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  preview: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 2,
    marginBottom: 16,
  },
  previewCalories: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  previewMacros: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
