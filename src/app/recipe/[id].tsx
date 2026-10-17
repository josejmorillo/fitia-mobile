import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  deleteRecipe,
  getRecipeIngredients,
  getRecipes,
} from '@/services/recipeService';
import { getOrCreateProfile } from '@/services/profileService';
import { colors } from '@/utils/colors';
import { ingredientTotals } from '@/utils/macros';
import { calcCarbRations, formatRations } from '@/utils/rations';
import type { Recipe, RecipeIngredient, UserProfile } from '@/utils/types';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        const [recipes, ings, prof] = await Promise.all([
          getRecipes(),
          getRecipeIngredients(Number(id)),
          getOrCreateProfile(),
        ]);
        if (cancelled) return;
        const found = recipes.find((r) => r.id === Number(id)) ?? null;
        setRecipe(found);
        setIngredients(ings);
        setProfile(prof);
        setLoading(false);
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  async function handleDelete() {
    Alert.alert('Borrar receta', '¿Seguro que quieres borrarla?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await deleteRecipe(Number(id));
          router.back();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Receta no encontrada</Text>
      </View>
    );
  }

  const total = ingredientTotals(
    ingredients.filter((i) => i.food).map((i) => ({ food: i.food!, amount: i.amount }))
  );
  const showRations = profile?.diabetesModeEnabled ?? false;
  const gramsPerRation = profile?.carbRationGrams ?? 10;
  const rationLabel =
    showRations && gramsPerRation > 0
      ? ` · ${formatRations(calcCarbRations(total.carbs, gramsPerRation))} R`
      : '';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Receta',
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/recipe/edit/[id]', params: { id: String(id) } })
                }
                hitSlop={8}>
                <Ionicons name="pencil-outline" size={22} color="#007AFF" />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Ionicons name="trash-outline" size={22} color="#ff4d4d" />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{recipe.emoji}</Text>
          <Text style={styles.name}>{recipe.name}</Text>
        </View>

        <View style={styles.macrosRow}>
          <Text style={styles.macrosText}>
            {Math.round(total.calories)} kcal · P {Math.round(total.protein)}g · C{' '}
            {Math.round(total.carbs)}g{rationLabel} · G {Math.round(total.fat)}g
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {ingredients.map((ing) => (
          <View key={ing.id} style={styles.ingRow}>
            <Text style={styles.ingEmoji}>{ing.food?.emoji ?? '🍽️'}</Text>
            <Text style={styles.ingName} numberOfLines={1}>
              {ing.food?.name ?? '—'}
            </Text>
            <Text style={styles.ingAmount}>{ing.amount} g</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFound: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  macrosRow: {
    marginBottom: 16,
  },
  macrosText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 6,
  },
  ingEmoji: {
    fontSize: 20,
  },
  ingName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ingAmount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
