import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { RecipeForm } from '@/components/recipe/RecipeForm';
import {
  getRecipeIngredients,
  getRecipes,
  replaceRecipeIngredients,
  updateRecipe,
} from '@/services/recipeService';
import { colors } from '@/utils/colors';
import type { RecipeIngredient } from '@/utils/types';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<{
    name: string;
    emoji: string;
    servingGrams: number | null;
    ingredients: RecipeIngredient[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const recipes = await getRecipes();
      const found = recipes.find((r) => r.id === Number(id)) ?? null;
      const ingredients = await getRecipeIngredients(Number(id));
      setInitial(
        found
          ? {
              name: found.name,
              emoji: found.emoji,
              servingGrams: found.servingGrams,
              ingredients,
            }
          : null
      );
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  if (!initial) {
    return <View style={styles.center} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editar receta' }} />
      <RecipeForm
        initial={initial}
        submitLabel="Guardar cambios"
        onSubmit={async ({ name, emoji, servingGrams, items }) => {
          await updateRecipe(Number(id), name, emoji, servingGrams);
          await replaceRecipeIngredients(
            Number(id),
            items.map((i) => ({ foodId: i.food.id, amount: i.amount }))
          );
          router.back();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
