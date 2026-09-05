import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { FoodForm } from '@/components/food/FoodForm';
import {
  countFoodReferences,
  deleteFood,
  getFood,
  updateFood,
} from '@/services/foodService';
import { buildFoodEnvelope, foodToPayload, shareJson } from '@/services/shareService';
import { colors } from '@/utils/colors';
import type { Food } from '@/utils/types';

export default function EditFoodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFood(Number(id)).then((f) => {
      setFood(f);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    const refs = await countFoodReferences(Number(id));
    if (refs > 0) {
      Alert.alert('No se puede borrar', 'Este alimento está en uso en tu diario o recetas.');
      return;
    }
    Alert.alert('Borrar alimento', '¿Seguro que quieres borrarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await deleteFood(Number(id));
          router.back();
        },
      },
    ]);
  }

  async function handleShare() {
    if (!food) return;
    try {
      await shareJson(buildFoodEnvelope(foodToPayload(food)), 'Compartir alimento');
    } catch {
      Alert.alert('Error', 'No se pudo compartir el alimento.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Alimento no encontrado</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={handleShare} hitSlop={8}>
                <Ionicons name="share-outline" size={22} color={colors.primaryDark} />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Ionicons name="trash-outline" size={22} color="#ff4d4d" />
              </Pressable>
            </View>
          ),
        }}
      />
      <FoodForm
        initial={food}
        submitLabel="Guardar cambios"
        onSubmit={async (input) => {
          await updateFood(Number(id), input);
          router.back();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
});
