import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { FoodPickerModal } from '@/components/food/FoodPickerModal';
import { addIngredient, createRecipe } from '@/services/recipeService';
import { colors } from '@/utils/colors';
import type { Food } from '@/utils/types';

interface IngredientDraft {
  food: Food;
  amount: string;
}

export default function NewRecipeScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFood(food: Food) {
    setIngredients((prev) => [...prev, { food, amount: '100' }]);
    setPickerVisible(false);
  }

  function updateAmount(index: number, value: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, amount: value } : ing))
    );
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (ingredients.length === 0) {
      setError('Añade al menos un alimento.');
      return;
    }
    const recipeId = await createRecipe(name.trim(), emoji.trim() || '🍽️');
    for (const ing of ingredients) {
      const amount = parseFloat(ing.amount.replace(',', '.')) || 0;
      if (amount > 0) {
        await addIngredient(recipeId, ing.food.id, amount);
      }
    }
    router.back();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej. Batido de proteína"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Emoji</Text>
        <TextInput style={styles.input} value={emoji} onChangeText={setEmoji} maxLength={4} />
      </View>

      <Text style={styles.label}>Ingredientes</Text>
      {ingredients.length > 0 ? (
        <View style={styles.ingredientList}>
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.ingEmoji}>{ing.food.emoji}</Text>
              <Text style={styles.ingName} numberOfLines={1}>
                {ing.food.name}
              </Text>
              <TextInput
                style={styles.amountInput}
                value={ing.amount}
                onChangeText={(v) => updateAmount(i, v)}
                keyboardType="numeric"
              />
              <Text style={styles.unit}>g</Text>
              <Pressable onPress={() => removeIngredient(i)} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable style={styles.addIngredientBtn} onPress={() => setPickerVisible(true)}>
        <Ionicons name="add" size={18} color={colors.primaryDark} />
        <Text style={styles.addIngredientText}>Añadir alimento</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Guardar receta</Text>
      </Pressable>

      <FoodPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={addFood}
      />
    </ScrollView>
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
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  ingredientList: {
    gap: 8,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
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
  amountInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: colors.text,
    width: 60,
    textAlign: 'right',
  },
  unit: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addIngredientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  addIngredientText: {
    fontSize: 14,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
});
