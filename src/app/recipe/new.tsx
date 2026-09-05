import { useRouter } from 'expo-router';

import { RecipeForm } from '@/components/recipe/RecipeForm';
import { addIngredient, createRecipe } from '@/services/recipeService';

export default function NewRecipeScreen() {
  const router = useRouter();

  return (
    <RecipeForm
      submitLabel="Guardar receta"
      onSubmit={async ({ name, emoji, items }) => {
        const recipeId = await createRecipe(name, emoji);
        for (const item of items) {
          await addIngredient(recipeId, item.food.id, item.amount);
        }
        router.back();
      }}
    />
  );
}
