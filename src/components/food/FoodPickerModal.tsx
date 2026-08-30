import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllFoods } from '@/services/foodService';
import { colors } from '@/utils/colors';
import type { Food } from '@/utils/types';

interface FoodPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: Food) => void;
}

export function FoodPickerModal({ visible, onClose, onSelect }: FoodPickerModalProps) {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);

  useEffect(() => {
    if (visible) {
      setQuery('');
      getAllFoods().then(setFoods);
    }
  }, [visible]);

  const q = query.toLowerCase();
  const filtered = foods.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.brand ?? '').toLowerCase().includes(q)
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Añadir alimento</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Buscar alimento..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />

        <FlatList
          data={filtered}
          keyExtractor={(f) => String(f.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={styles.foodRow} onPress={() => onSelect(item)}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.foodMacros}>
                  {item.caloriesPer100g} kcal · P {item.proteinPer100g} · C {item.carbsPer100g} · G{' '}
                  {item.fatPer100g} /100g
                </Text>
              </View>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Sin alimentos. Añádelos en la pestaña Alimentos.</Text>
          }
        />
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
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emoji: {
    fontSize: 24,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  foodMacros: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: 32,
  },
});
