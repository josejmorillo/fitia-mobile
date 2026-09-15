import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/utils/colors';

interface ConfirmDeleteModalProps {
  visible: boolean;
  title: string;
  warning: string;
  onClose: () => void;
  onConfirm: () => void;
}

const KEYWORD = 'confirmar';

/** Confirmación destructiva: obliga a escribir "confirmar" para habilitar el botón. */
export function ConfirmDeleteModal({
  visible,
  title,
  warning,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [value, setValue] = useState('');
  const [wasVisible, setWasVisible] = useState(false);

  if (visible && !wasVisible) {
    setWasVisible(true);
    setValue('');
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  const canConfirm = value.trim().toLowerCase() === KEYWORD;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.warning}>{warning}</Text>
          <Text style={styles.label}>Escribe «{KEYWORD}» para confirmar:</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={KEYWORD}
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.deleteBtn, !canConfirm && styles.btnDisabled]}
              onPress={onConfirm}
              disabled={!canConfirm}>
              <Text style={styles.deleteText}>Borrar todo</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    color: '#C62828',
  },
  warning: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
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
  deleteBtn: {
    backgroundColor: '#C62828',
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
