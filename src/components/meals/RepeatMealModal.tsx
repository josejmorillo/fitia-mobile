import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';
import { MEAL_LABELS } from '@/utils/constants';
import type { MealType } from '@/utils/types';

export const WEEK_DAYS: { key: string; label: string }[] = [
  { key: 'MONDAY', label: 'Lun' },
  { key: 'TUESDAY', label: 'Mar' },
  { key: 'WEDNESDAY', label: 'Mié' },
  { key: 'THURSDAY', label: 'Jue' },
  { key: 'FRIDAY', label: 'Vie' },
  { key: 'SATURDAY', label: 'Sáb' },
  { key: 'SUNDAY', label: 'Dom' },
];

const WEEKS = [1, 2, 3, 4];

interface RepeatMealModalProps {
  visible: boolean;
  mealType: MealType;
  loading: boolean;
  onClose: () => void;
  onRepeat: (weeks: number, selectedDays: string[]) => void;
}

export function RepeatMealModal({
  visible,
  mealType,
  loading,
  onClose,
  onRepeat,
}: RepeatMealModalProps) {
  const [weeks, setWeeks] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>(['MONDAY']);

  function toggleDay(key: string) {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  function handleRepeat() {
    if (selectedDays.length === 0) return;
    onRepeat(weeks, selectedDays);
  }

  const dayCount = selectedDays.length * weeks;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>
            Repetir {MEAL_LABELS[mealType].toLowerCase()} a otros días
          </Text>
          <Text style={styles.subtitle}>
            Se copiarán los alimentos actuales (sin marcar) a los días elegidos durante las
            próximas semanas, sin borrar lo que ya haya.
          </Text>

          <Text style={styles.sectionLabel}>Semanas</Text>
          <View style={styles.chips}>
            {WEEKS.map((w) => {
              const active = w === weeks;
              return (
                <Pressable
                  key={w}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setWeeks(w)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{w}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Días de la semana</Text>
          <View style={styles.chips}>
            {WEEK_DAYS.map((d) => {
              const active = selectedDays.includes(d.key);
              return (
                <Pressable
                  key={d.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleDay(d.key)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.confirmBtn, selectedDays.length === 0 && styles.btnDisabled]}
              onPress={handleRepeat}
              disabled={selectedDays.length === 0 || loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#1A1A1A" />
              ) : (
                <Text style={styles.confirmText}>
                  Copiar a {dayCount} {dayCount === 1 ? 'día' : 'días'}
                </Text>
              )}
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
    maxWidth: 380,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
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
