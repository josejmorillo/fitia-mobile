import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '@/utils/colors';
import { useKeyboardHeight } from '@/utils/useKeyboardHeight';
import type { DailyLogItem } from '@/utils/types';

interface AmountModalProps {
  item: DailyLogItem | null;
  onClose: () => void;
  onSave: (itemId: number, amount: number) => void;
}

type Unit = 'units' | 'g';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AmountModal({ item, onClose, onSave }: AmountModalProps) {
  const keyboardHeight = useKeyboardHeight();
  const recipe = item?.recipe;
  const food = item?.food;
  const servingGrams = recipe?.servingGrams ?? food?.servingAmount ?? null;
  const unitName = recipe ? 'raciones' : (food?.servingName ?? 'unidades');
  const unitLabel = recipe ? 'Raciones' : capitalize(unitName);

  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [wasOpen, setWasOpen] = useState(false);

  if (item && !wasOpen) {
    setWasOpen(true);
    setUnit(servingGrams ? 'units' : 'g');
    const initial = servingGrams ? item.amount / servingGrams : item.amount;
    const rounded = Math.round(initial * 100) / 100;
    setValue(String(rounded));
  } else if (!item && wasOpen) {
    setWasOpen(false);
  }

  const name = food ? `${food.emoji} ${food.name}` : recipe ? `${recipe.emoji} ${recipe.name}` : '';

  function handleSave() {
    if (!item) return;
    const parsed = parseFloat(value.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    const grams = unit === 'units' && servingGrams ? parsed * servingGrams : parsed;
    if (grams <= 0) return;
    onSave(item.id, grams);
  }

  const parsedValue = parseFloat(value.replace(',', '.'));
  const quantity = isNaN(parsedValue) ? 0 : parsedValue;

  return (
    <Modal visible={item != null} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[
          styles.backdrop,
          Platform.OS === 'android' && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight }
            : null,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Cantidad</Text>
          {name ? (
            <Text style={styles.foodName} numberOfLines={1}>
              {name}
            </Text>
          ) : null}

          {servingGrams ? (
            <View style={styles.segmented}>
              <Pressable
                style={[styles.segment, unit === 'units' && styles.segmentActive]}
                onPress={() => setUnit('units')}>
                <Text style={[styles.segmentText, unit === 'units' && styles.segmentTextActive]}>
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

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
          />
          {unit === 'units' && servingGrams ? (
            <Text style={styles.hint}>Equivale a {Math.round(quantity * servingGrams)} g</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.saveText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxWidth: 360,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  foodName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginTop: 14,
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: colors.text,
    marginTop: 14,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveText: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
});
