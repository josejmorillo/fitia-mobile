import { useRouter } from 'expo-router';

import { FoodForm } from '@/components/food/FoodForm';
import { createFood } from '@/services/foodService';

export default function NewFoodScreen() {
  const router = useRouter();

  return (
    <FoodForm
      submitLabel="Guardar"
      onSubmit={async (input) => {
        await createFood(input);
        router.back();
      }}
    />
  );
}
