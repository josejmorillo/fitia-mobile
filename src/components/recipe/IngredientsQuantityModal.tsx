import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/utils/colors';
import { foodMacros } from '@/utils/macros';
import { useKeyboardHeight } from '@/utils/useKeyboardHeight';
import type { Food } from '@/utils/types';

interface DraftItem {
  food: Food;
  amount: string;
  unit: 'g' | 'units';
}

interface IngredientsQuantityModalProps {
  foods: Food[] | null;
  onClose: () => void;
  onConfirm: (items: { food: Food; amount: number }[]) => void;
}

export function IngredientsQuantityModal({
  foods,
  onClose,
  onConfirm,
}: IngredientsQuantityModalProps) {
  const keyboardHeight = useKeyboardHeight();
  const [items, setItems] = useState<DraftItem[]>([]);
  const [wasVisible, setWasVisible] = useState(false);

  if (foods && !wasVisible) {
    setWasVisible(true);
    setItems(
      foods.map((food) =>
        food.servingName && food.servingAmount
          ? { food, amount: '1', unit: 'units' }
          : { food, amount: '100', unit: 'g' }
      )
    );
  } else if (!foods && wasVisible) {
    setWasVisible(false);
  }

  function updateAmount(index: number, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, amount: value } : it)));
  }

  function updateUnit(index: number, unit: 'g' | 'units') {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, unit } : it)));
  }

  function gramsFor(item: DraftItem): number {
    const parsed = parseFloat(item.amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return 0;
    if (item.unit === 'units' && item.food.servingAmount) {
      return parsed * item.food.servingAmount;
    }
    return parsed;
  }

  function handleConfirm() {
    const result = items
      .map((item) => ({ food: item.food, amount: gramsFor(item) }))
      .filter((i) => i.amount > 0);
    if (result.length > 0) onConfirm(result);
  }

  return (
    <Modal visible={foods != null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Cantidades</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={[
            styles.flex,
            Platform.OS === 'android' && keyboardHeight > 0
              ? { paddingBottom: keyboardHeight }
              : null,
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {items.map((item, index) => {
            const grams = gramsFor(item);
            const macros = grams > 0 ? foodMacros(item.food, grams) : null;
            const hasServing = !!(item.food.servingName && item.food.servingAmount);
            return (
              <View key={item.food.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.emoji}>{item.food.emoji}</Text>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.food.name}
                  </Text>
                  {macros ? <Text style={styles.macros}>{macros.calories} kcal</Text> : null}
                </View>

                {hasServing ? (
                  <View style={styles.segmented}>
                    <Pressable
                      style={[styles.segment, item.unit === 'units' && styles.segmentActive]}
                      onPress={() => updateUnit(index, 'units')}>
                      <Text
                        style={[
                          styles.segmentText,
                          item.unit === 'units' && styles.segmentTextActive,
                        ]}>
                        {item.food.servingName}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.segment, item.unit === 'g' && styles.segmentActive]}
                      onPress={() => updateUnit(index, 'g')}>
                      <Text
                        style={[styles.segmentText, item.unit === 'g' && styles.segmentTextActive]}>
                        Gramos
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={styles.amountRow}>
                  <TextInput
                    style={styles.input}
                    value={item.amount}
                    onChangeText={(v) => updateAmount(index, v)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitLabel}>
                    {item.unit === 'units' ? (item.food.servingName ?? 'unidades') : 'g'}
                  </Text>
                  {item.unit === 'units' && hasServing ? (
                    <Text style={styles.equiv}>= {Math.round(grams)} g</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Añadir {items.length} a la receta</Text>
        </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 22,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  macros: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 13,
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
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 80,
  },
  equiv: {
    fontSize: 12,
    color: colors.textTertiary,
    width: 70,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
});
