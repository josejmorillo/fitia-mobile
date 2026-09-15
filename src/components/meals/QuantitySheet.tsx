import { Ionicons } from '@expo/vector-icons';
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

export interface QuantityMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface QuantitySheetProps {
  visible: boolean;
  emoji: string;
  name: string;
  subtitle?: string;
  units?: {
    labels: [string, string];
    value: 'units' | 'g';
    onChange: (unit: 'units' | 'g') => void;
  } | null;
  amount: string;
  onAmountChange: (value: string) => void;
  unitSuffix: string;
  hint?: string;
  macros: QuantityMacros;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Hoja minimalista para elegir cantidad y ver los macros antes de añadir. */
export function QuantitySheet({
  visible,
  emoji,
  name,
  subtitle,
  units,
  amount,
  onAmountChange,
  unitSuffix,
  hint,
  macros,
  confirmLabel = 'Añadir',
  confirmDisabled,
  onClose,
  onConfirm,
}: QuantitySheetProps) {
  const keyboardHeight = useKeyboardHeight();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[
          styles.backdrop,
          Platform.OS === 'android' && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight }
            : null,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Pressable style={styles.close} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={20} color={colors.textTertiary} />
          </Pressable>

          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}

          {units ? (
            <View style={styles.toggle}>
              <Pressable
                style={[styles.toggleItem, units.value === 'units' && styles.toggleItemActive]}
                onPress={() => units.onChange('units')}>
                <Text
                  style={[styles.toggleText, units.value === 'units' && styles.toggleTextActive]}>
                  {units.labels[0]}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleItem, units.value === 'g' && styles.toggleItemActive]}
                onPress={() => units.onChange('g')}>
                <Text style={[styles.toggleText, units.value === 'g' && styles.toggleTextActive]}>
                  {units.labels[1]}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.amountBox}>
            <TextInput
              style={styles.amount}
              value={amount}
              onChangeText={onAmountChange}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <Text style={styles.amountUnit}>{unitSuffix}</Text>
          </View>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}

          <Text style={styles.macros}>
            <Text style={styles.macrosKcal}>{macros.calories} kcal</Text>
            {`  ·  P ${macros.protein} · C ${macros.carbs} · G ${macros.fat}`}
          </Text>

          <Pressable
            style={[styles.confirmBtn, confirmDisabled && styles.confirmBtnDisabled]}
            onPress={onConfirm}
            disabled={confirmDisabled}>
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    top: 10,
    right: 12,
    padding: 4,
  },
  emoji: {
    fontSize: 40,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 999,
    padding: 3,
    gap: 2,
    marginTop: 16,
  },
  toggleItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toggleItemActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    minWidth: 170,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    minWidth: 64,
    textAlign: 'center',
    padding: 0,
  },
  amountUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  macros: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  macrosKcal: {
    fontWeight: '700',
    color: colors.text,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 18,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
});
