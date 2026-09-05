import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/utils/colors';
import type { DailyLogItem } from '@/utils/types';

interface AmountModalProps {
  item: DailyLogItem | null;
  onClose: () => void;
  onSave: (itemId: number, amount: number) => void;
}

type Unit = 'g' | 'raciones';

export function AmountModal({ item, onClose, onSave }: AmountModalProps) {
  const servingGrams = item?.recipe?.servingGrams ?? null;
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [wasOpen, setWasOpen] = useState(false);

  if (item && !wasOpen) {
    setWasOpen(true);
    setUnit(servingGrams ? 'raciones' : 'g');
    const initial = item.recipe && servingGrams ? item.amount / servingGrams : item.amount;
    const rounded = Math.round(initial * 100) / 100;
    setValue(Number.isInteger(rounded) ? String(rounded) : String(rounded));
  } else if (!item && wasOpen) {
    setWasOpen(false);
  }

  const name = item?.food ? `${item.food.emoji} ${item.food.name}` : item?.recipe ? `${item.recipe.emoji} ${item.recipe.name}` : '';

  function handleSave() {
    if (!item) return;
    const parsed = parseFloat(value.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    const grams = unit === 'raciones' && servingGrams ? parsed * servingGrams : parsed;
    if (grams <= 0) return;
    onSave(item.id, grams);
  }

  return (
    <Modal visible={item != null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
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
                style={[styles.segment, unit === 'raciones' && styles.segmentActive]}
                onPress={() => setUnit('raciones')}>
                <Text style={[styles.segmentText, unit === 'raciones' && styles.segmentTextActive]}>
                  Raciones
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
          {unit === 'raciones' && servingGrams ? (
            <Text style={styles.hint}>
              {(() => {
                const n = parseFloat(value.replace(',', '.'));
                const q = isNaN(n) ? 0 : n;
                return `Equivale a ${Math.round(q * servingGrams)} g`;
              })()}
            </Text>
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
