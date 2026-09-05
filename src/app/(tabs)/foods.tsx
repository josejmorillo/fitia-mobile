import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllFoods } from '@/services/foodService';
import { getRecipeIngredients, getRecipes } from '@/services/recipeService';
import {
  buildFoodEnvelope,
  buildRecipeEnvelope,
  foodToPayload,
  shareJson,
} from '@/services/shareService';
import { colors } from '@/utils/colors';
import type { Food, Recipe } from '@/utils/types';

type Mode = 'foods' | 'recipes';

export default function FoodsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('foods');
  const [foods, setFoods] = useState<Food[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      getAllFoods().then(setFoods);
      getRecipes().then(setRecipes);
    }, [])
  );

  const q = query.toLowerCase();
  const filteredFoods = foods.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.brand ?? '').toLowerCase().includes(q)
  );

  async function shareFood(food: Food) {
    try {
      await shareJson(buildFoodEnvelope(foodToPayload(food)), 'Compartir alimento');
    } catch {
      Alert.alert('Error', 'No se pudo compartir el alimento.');
    }
  }

  async function shareRecipe(recipe: Recipe) {
    try {
      const ingredients = await getRecipeIngredients(recipe.id);
      await shareJson(
        buildRecipeEnvelope({
          name: recipe.name,
          emoji: recipe.emoji,
          ingredients: ingredients
            .filter((i) => i.food)
            .map((i) => ({ food: foodToPayload(i.food!), amount: i.amount })),
        }),
        'Compartir receta'
      );
    } catch {
      Alert.alert('Error', 'No se pudo compartir la receta.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Base de datos</Text>

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

      {mode === 'foods' ? (
        <>
          <TextInput
            style={styles.search}
            placeholder="Buscar alimento..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          <FlatList
            data={filteredFoods}
            keyExtractor={(f) => String(f.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() =>
                  router.push({ pathname: '/food/[id]', params: { id: String(item.id) } })
                }>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.macros}>
                    {item.caloriesPer100g} kcal · P {item.proteinPer100g} · C {item.carbsPer100g} · G{' '}
                    {item.fatPer100g} /100g
                  </Text>
                </View>
                <Pressable style={styles.shareBtn} onPress={() => shareFood(item)} hitSlop={8}>
                  <Ionicons name="share-outline" size={18} color={colors.primaryDark} />
                </Pressable>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {foods.length === 0
                  ? 'Todavía no hay alimentos. Pulsa + para añadir el primero.'
                  : 'Sin resultados.'}
              </Text>
            }
          />
        </>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({ pathname: '/recipe/[id]', params: { id: String(item.id) } })
              }>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.macros}>{item.ingredientCount ?? 0} ingredientes</Text>
              </View>
              <Pressable style={styles.shareBtn} onPress={() => shareRecipe(item)} hitSlop={8}>
                <Ionicons name="share-outline" size={18} color={colors.primaryDark} />
              </Pressable>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Todavía no hay recetas. Pulsa + para crear la primera.</Text>
          }
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push(mode === 'foods' ? '/food/new' : '/recipe/new')}>
        <Ionicons name="add" size={28} color="#1A1A1A" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 8,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emoji: {
    fontSize: 24,
  },
  shareBtn: {
    padding: 4,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  macros: {
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
