import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createFood, getFood, type FoodInput } from '@/services/foodService';
import { EmojiPickerModal } from '@/components/common/EmojiPickerModal';
import { FoodPickerModal } from '@/components/food/FoodPickerModal';
import { FoodForm } from '@/components/food/FoodForm';
import { colors } from '@/utils/colors';
import type { Food, RecipeIngredient } from '@/utils/types';

export interface RecipeFormValues {
  name: string;
  emoji: string;
  items: { food: Food; amount: number }[];
}

interface RecipeFormProps {
  initial?: { name: string; emoji: string; ingredients: RecipeIngredient[] } | null;
  onSubmit: (values: RecipeFormValues) => Promise<void> | void;
  submitLabel: string;
}

interface Draft {
  key: string;
  food: Food;
  amount: string;
}

export function RecipeForm({ initial, onSubmit, submitLabel }: RecipeFormProps) {
  const keySeq = useRef(0);
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🍽️');
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    (initial?.ingredients ?? [])
      .map((ing, i) =>
        ing.food
          ? { key: `init-${i}`, food: ing.food, amount: String(ing.amount) }
          : null
      )
      .filter((d): d is Draft => d != null)
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [emojiVisible, setEmojiVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addDraft(food: Food) {
    setDrafts((prev) => [
      ...prev,
      { key: `n${keySeq.current++}`, food, amount: '100' },
    ]);
  }

  function addFood(food: Food) {
    addDraft(food);
    setPickerVisible(false);
  }

  function updateAmount(key: string, value: string) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, amount: value } : d)));
  }

  function removeDraft(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  async function handleCreateFood(input: FoodInput) {
    const foodId = await createFood(input);
    const food = await getFood(foodId);
    if (food) {
      addDraft(food);
      setCreateVisible(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (drafts.length === 0) {
      setError('Añade al menos un alimento.');
      return;
    }
    const items = drafts
      .map((d) => ({ food: d.food, amount: parseFloat(d.amount.replace(',', '.')) || 0 }))
      .filter((i) => i.amount > 0);
    if (items.length === 0) {
      setError('Añade cantidades válidas (g).');
      return;
    }
    setSaving(true);
    setError(null);
    await onSubmit({ name: name.trim(), emoji: emoji.trim() || '🍽️', items });
  }

  return (
    <>
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
          <Pressable style={styles.emojiBtn} onPress={() => setEmojiVisible(true)}>
            <Text style={styles.emojiValue}>{emoji || '🍽️'}</Text>
            <Text style={styles.emojiHint}>Cambiar</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.label}>Ingredientes</Text>
        {drafts.length > 0 ? (
          <View style={styles.ingredientList}>
            {drafts.map((d) => (
              <View key={d.key} style={styles.ingredientRow}>
                <Text style={styles.ingEmoji}>{d.food.emoji}</Text>
                <Text style={styles.ingName} numberOfLines={1}>
                  {d.food.name}
                </Text>
                <TextInput
                  style={styles.amountInput}
                  value={d.amount}
                  onChangeText={(v) => updateAmount(d.key, v)}
                  keyboardType="numeric"
                />
                <Text style={styles.unit}>g</Text>
                <Pressable onPress={() => removeDraft(d.key)} hitSlop={8}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.addRow}>
          <Pressable style={styles.addIngredientBtn} onPress={() => setPickerVisible(true)}>
            <Ionicons name="add" size={18} color={colors.primaryDark} />
            <Text style={styles.addIngredientText}>Añadir alimento</Text>
          </Pressable>
          <Pressable style={[styles.addIngredientBtn, styles.newFoodBtn]} onPress={() => setCreateVisible(true)}>
            <Ionicons name="create-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.addIngredientText}>Nuevo alimento</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Guardando…' : submitLabel}</Text>
        </Pressable>
      </ScrollView>

      <FoodPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={addFood}
      />

      <EmojiPickerModal
        visible={emojiVisible}
        onClose={() => setEmojiVisible(false)}
        onPick={setEmoji}
      />

      <Modal visible={createVisible} animationType="slide" onRequestClose={() => setCreateVisible(false)}>
        <SafeAreaView style={styles.modalWrap} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo alimento</Text>
            <Pressable onPress={() => setCreateVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <FoodForm submitLabel="Guardar alimento" onSubmit={handleCreateFood} />
        </SafeAreaView>
      </Modal>
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
  field: {
    marginBottom: 14,
  },
  emojiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  emojiValue: {
    fontSize: 26,
  },
  emojiHint: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
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
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addIngredientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
  },
  newFoodBtn: {
    borderStyle: 'solid',
  },
  addIngredientText: {
    fontSize: 13,
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
  modalWrap: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
});
