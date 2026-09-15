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

type Tab = 'foods' | 'recipes';

export function ImportPreviewModal({
  items,
  loading,
  onClose,
  onConfirm,
}: ImportPreviewModalProps) {
  const [tab, setTab] = useState<Tab>('foods');
  const [selected, setSelected] = useState<string[]>([]);
  const [wasVisible, setWasVisible] = useState(false);

  if (items && !wasVisible) {
    setWasVisible(true);
    setTab('foods');
    setSelected(items.filter((i) => !i.exists).map((i) => i.key));
  } else if (!items && wasVisible) {
    setWasVisible(false);
  }

  const foods = items?.filter((i) => i.kind === 'food') ?? [];
  const recipes = items?.filter((i) => i.kind === 'recipe') ?? [];

  // Alimentos requeridos por las recetas seleccionadas (se marcan y se bloquean).
  const lockedFoods = new Map<string, string>();
  for (const r of recipes) {
    if (!selected.includes(r.key)) continue;
    for (const fk of r.ingredientFoodKeys ?? []) {
      const food = foods.find((f) => f.key === fk);
      if (!food || food.exists) continue;
      if (!lockedFoods.has(fk)) lockedFoods.set(fk, r.name);
    }
  }

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function handleConfirm() {
    const keys = Array.from(new Set([...selected, ...lockedFoods.keys()]));
    onConfirm(keys);
  }

  const newCount = items?.filter((i) => !i.exists).length ?? 0;
  const existsCount = (items?.length ?? 0) - newCount;
  const totalSelected = Array.from(new Set([...selected, ...lockedFoods.keys()])).length;
  const data = tab === 'foods' ? foods : recipes;

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
          quieras añadir. No se borrará nada de tu base de datos. Los alimentos necesarios para las
          recetas seleccionadas se añaden siempre.
        </Text>

        <View style={styles.segmented}>
          <Pressable
            style={[styles.segment, tab === 'foods' && styles.segmentActive]}
            onPress={() => setTab('foods')}>
            <Text style={[styles.segmentText, tab === 'foods' && styles.segmentTextActive]}>
              Alimentos ({foods.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segment, tab === 'recipes' && styles.segmentActive]}
            onPress={() => setTab('recipes')}>
            <Text style={[styles.segmentText, tab === 'recipes' && styles.segmentTextActive]}>
              Recetas ({recipes.length})
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={data}
          keyExtractor={(i) => i.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isLocked = tab === 'foods' && lockedFoods.has(item.key);
            const disabled = item.exists || isLocked;
            const checked = !item.exists && (selected.includes(item.key) || isLocked);
            const lockedBy = lockedFoods.get(item.key);

            return (
              <Pressable
                style={[styles.row, disabled && styles.rowDisabled]}
                onPress={() => !disabled && toggle(item.key)}
                disabled={disabled}>
                <Ionicons
                  name={
                    disabled && item.exists
                      ? 'checkmark-done-circle-outline'
                      : isLocked
                        ? 'lock-closed'
                        : checked
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                  }
                  size={22}
                  color={
                    disabled && item.exists
                      ? colors.textTertiary
                      : isLocked
                        ? colors.primaryDark
                        : checked
                          ? colors.primary
                          : colors.border
                  }
                />
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.detail}>
                    {item.kind === 'recipe' ? `Receta · ${item.detail ?? ''}` : 'Alimento'}
                    {item.exists ? ' · ya existe' : ''}
                    {lockedBy ? ` · necesario para «${lockedBy}»` : ''}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />

        <Pressable
          style={[styles.confirmBtn, (totalSelected === 0 || loading) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={totalSelected === 0 || loading}>
          <Text style={styles.confirmText}>
            {loading ? 'Importando…' : `Añadir ${totalSelected} seleccionado(s)`}
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
    marginBottom: 10,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 4,
    gap: 4,
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
    opacity: 0.6,
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
