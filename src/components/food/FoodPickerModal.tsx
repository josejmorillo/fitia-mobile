import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllFoods } from '@/services/foodService';
import { getRecipes } from '@/services/recipeService';
import { colors } from '@/utils/colors';
import type { Food, Recipe } from '@/utils/types';

interface FoodPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: Food) => void;
  onSelectRecipe?: (recipe: Recipe) => void;
  multiSelect?: boolean;
  onSelectMany?: (foods: Food[]) => void;
}

type Mode = 'foods' | 'recipes';

export function FoodPickerModal({
  visible,
  onClose,
  onSelect,
  onSelectRecipe,
  multiSelect,
  onSelectMany,
}: FoodPickerModalProps) {
  const [mode, setMode] = useState<Mode>('foods');
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [wasVisible, setWasVisible] = useState(false);
  const onSelectRecipeRef = useRef(onSelectRecipe);

  useEffect(() => {
    onSelectRecipeRef.current = onSelectRecipe;
  }, [onSelectRecipe]);

  if (visible && !wasVisible) {
    setWasVisible(true);
    setQuery('');
    setMode('foods');
    setSelectedIds([]);
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  useEffect(() => {
    if (!visible || !wasVisible) return;
    getAllFoods().then(setFoods);
    if (onSelectRecipeRef.current) getRecipes().then(setRecipes);
  }, [visible, wasVisible]);

  const q = query.toLowerCase();
  const filteredFoods = foods.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.brand ?? '').toLowerCase().includes(q)
  );
  const filteredRecipes = recipes.filter((r) => r.name.toLowerCase().includes(q));

  function toggleSelect(food: Food) {
    setSelectedIds((prev) =>
      prev.includes(food.id) ? prev.filter((id) => id !== food.id) : [...prev, food.id]
    );
  }

  function confirmMany() {
    const selected = foods.filter((f) => selectedIds.includes(f.id));
    if (selected.length > 0) onSelectMany?.(selected);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{multiSelect ? 'Elegir alimentos' : 'Añadir'}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {!multiSelect && onSelectRecipe && (
          <View style={styles.segmented}>
            <Pressable
              style={[styles.segment, mode === 'foods' && styles.segmentActive]}
              onPress={() => setMode('foods')}>
              <Text style={[styles.segmentText, mode === 'foods' && styles.segmentTextActive]}>
                Alimentos
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, mode === 'recipes' && styles.segmentActive]}
              onPress={() => setMode('recipes')}>
              <Text style={[styles.segmentText, mode === 'recipes' && styles.segmentTextActive]}>
                Recetas
              </Text>
            </Pressable>
          </View>
        )}

        <TextInput
          style={styles.search}
          placeholder={mode === 'foods' ? 'Buscar alimento...' : 'Buscar receta...'}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />

        {mode === 'foods' ? (
          <FlatList
            data={filteredFoods}
            keyExtractor={(f) => String(f.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const checked = selectedIds.includes(item.id);
              return (
                <Pressable
                  style={styles.foodRow}
                  onPress={() => (multiSelect ? toggleSelect(item) : onSelect(item))}>
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
                  {multiSelect ? (
                    <Ionicons
                      name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={checked ? colors.primary : colors.border}
                    />
                  ) : (
                    <Ionicons name="add-circle" size={24} color={colors.primaryDark} />
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>Sin alimentos. Añádelos en la pestaña de base de datos.</Text>
            }
          />
        ) : (
          <FlatList
            data={filteredRecipes}
            keyExtractor={(r) => String(r.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.foodRow} onPress={() => onSelectRecipe?.(item)}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.foodMacros}>{item.ingredientCount ?? 0} ingredientes</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.primaryDark} />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Sin recetas. Créalas en la pestaña de base de datos.</Text>
            }
          />
        )}

        {multiSelect && (
          <Pressable
            style={[styles.confirmBtn, selectedIds.length === 0 && styles.confirmBtnDisabled]}
            onPress={confirmMany}
            disabled={selectedIds.length === 0}>
            <Text style={styles.confirmText}>
              {selectedIds.length > 0
                ? `Añadir ${selectedIds.length} alimento(s)`
                : 'Selecciona alimentos'}
            </Text>
          </Pressable>
        )}
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
