import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/utils/colors';
import type { DailyLogItem } from '@/utils/types';

interface AmountModalProps {
  item: DailyLogItem | null;
  onClose: () => void;
  onSave: (itemId: number, amount: number) => void;
}

export function AmountModal({ item, onClose, onSave }: AmountModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (item) {
      setValue(String(item.amount));
    }
  }, [item]);

  function handleSave() {
    if (!item) return;
    const amount = parseFloat(value.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;
    onSave(item.id, amount);
  }

  return (
    <Modal visible={item != null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Cantidad</Text>
          {item?.food && (
            <Text style={styles.foodName} numberOfLines={1}>
              {item.food.emoji} {item.food.name}
            </Text>
          )}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
          />
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
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
