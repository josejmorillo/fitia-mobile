import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ImportPreviewItem } from '@/services/shareService';
import { colors } from '@/utils/colors';

interface ImportPreviewModalProps {
  items: ImportPreviewItem[] | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (selectedKeys: string[]) => void;
}

export function ImportPreviewModal({
  items,
  loading,
  onClose,
  onConfirm,
}: ImportPreviewModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [wasVisible, setWasVisible] = useState(false);

  if (items && !wasVisible) {
    setWasVisible(true);
    setSelected(items.filter((i) => !i.exists).map((i) => i.key));
  } else if (!items && wasVisible) {
    setWasVisible(false);
  }

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  const newCount = items?.filter((i) => !i.exists).length ?? 0;
  const existsCount = (items?.length ?? 0) - newCount;

  return (
    <Modal visible={items != null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Importar</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <Text style={styles.hint}>
          {newCount} nuevo(s) · {existsCount} ya existían (no se duplican). Desmarca lo que no
          quieras añadir. No se borrará nada de tu base de datos. Los ingredientes de una receta se
          añaden siempre (son necesarios).
        </Text>

        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const checked = selected.includes(item.key);
            const disabled = item.exists;
            return (
              <Pressable
                style={[styles.row, disabled && styles.rowDisabled]}
                onPress={() => !disabled && toggle(item.key)}
                disabled={disabled}>
                <Ionicons
                  name={
                    disabled
                      ? 'checkmark-done-circle-outline'
                      : checked
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                  }
                  size={24}
                  color={disabled ? colors.textTertiary : checked ? colors.primary : colors.border}
                />
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.detail}>
                    {item.kind === 'recipe' ? `Receta · ${item.detail ?? ''}` : 'Alimento'}
                    {item.exists ? ' · ya existe' : ''}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />

        <Pressable
          style={[
            styles.confirmBtn,
            (selected.length === 0 || loading) && styles.confirmBtnDisabled,
          ]}
          onPress={() => onConfirm(selected)}
          disabled={selected.length === 0 || loading}>
          <Text style={styles.confirmText}>
            {loading ? 'Importando…' : `Añadir ${selected.length} seleccionado(s)`}
          </Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  detail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
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
