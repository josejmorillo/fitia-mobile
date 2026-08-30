import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { FoodInput } from '@/services/foodService';
import { colors } from '@/utils/colors';
import { FOOD_CATEGORIES } from '@/utils/constants';
import type { Food, NutritionData } from '@/utils/types';
import { AiFoodSearchModal } from './AiFoodSearchModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface FoodFormProps {
  initial?: Food | null;
  onSubmit: (input: FoodInput) => void | Promise<void>;
  submitLabel: string;
}

function NumericInput({
  label,
  value,
  onChange,
  placeholder = '0',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.gridCell}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

export function FoodForm({ initial, onSubmit, submitLabel }: FoodFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [kcal, setKcal] = useState(initial ? String(initial.caloriesPer100g) : '');
  const [protein, setProtein] = useState(initial ? String(initial.proteinPer100g) : '');
  const [carbs, setCarbs] = useState(initial ? String(initial.carbsPer100g) : '');
  const [fat, setFat] = useState(initial ? String(initial.fatPer100g) : '');
  const [category, setCategory] = useState(initial?.category ?? 'Otros');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🍽️');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);
  const [barcodeVisible, setBarcodeVisible] = useState(false);

  function applyNutritionData(data: NutritionData) {
    if (data.name) setName(data.name);
    if (data.brand) setBrand(data.brand);
    if (data.kcal_100g != null) setKcal(String(data.kcal_100g));
    if (data.protein_g != null) setProtein(String(data.protein_g));
    if (data.carbs_g != null) setCarbs(String(data.carbs_g));
    if (data.fat_g != null) setFat(String(data.fat_g));
    if (data.category && FOOD_CATEGORIES.includes(data.category)) setCategory(data.category);
    if (data.emoji) setEmoji(data.emoji);
  }

  function parseNum(s: string): number {
    return parseFloat(s.replace(',', '.')) || 0;
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    const kcalNum = parseNum(kcal);
    if (kcalNum <= 0) {
      setError('Introduce un valor válido de calorías.');
      return;
    }

    setSaving(true);
    await onSubmit({
      name: name.trim(),
      brand: brand.trim() || null,
      category,
      emoji: emoji.trim() || '🍽️',
      caloriesPer100g: kcalNum,
      proteinPer100g: parseNum(protein),
      carbsPer100g: parseNum(carbs),
      fatPer100g: parseNum(fat),
      servingName: null,
      servingAmount: null,
    });
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.discoveryRow}>
          <Pressable style={styles.discoveryBtn} onPress={() => setAiVisible(true)}>
            <Ionicons name="sparkles-outline" size={18} color="#1A1A1A" />
            <Text style={styles.discoveryText}>Buscar por IA</Text>
          </Pressable>
          <Pressable style={styles.discoveryBtn} onPress={() => setBarcodeVisible(true)}>
            <Ionicons name="barcode-outline" size={18} color="#1A1A1A" />
            <Text style={styles.discoveryText}>Escanear código</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej. Pechuga de pollo"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Marca</Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="Opcional"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Emoji</Text>
        <TextInput style={styles.input} value={emoji} onChangeText={setEmoji} maxLength={4} />
      </View>

      <Text style={styles.label}>Categoría</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}>
        {FOOD_CATEGORIES.map((cat) => {
          const selected = cat === category;
          return (
            <Pressable
              key={cat}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setCategory(cat)}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>Macros por 100 g</Text>
      <View style={styles.macroRow}>
        <NumericInput label="Calorías *" value={kcal} onChange={setKcal} />
        <NumericInput label="Proteína (g)" value={protein} onChange={setProtein} />
      </View>
      <View style={styles.macroRow}>
        <NumericInput label="Carbos (g)" value={carbs} onChange={setCarbs} />
        <NumericInput label="Grasa (g)" value={fat} onChange={setFat} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Guardando…' : submitLabel}</Text>
      </Pressable>
      </ScrollView>

      <AiFoodSearchModal
        visible={aiVisible}
        onClose={() => setAiVisible(false)}
        onApply={applyNutritionData}
      />
      <BarcodeScannerModal
        visible={barcodeVisible}
        onClose={() => setBarcodeVisible(false)}
        onApply={applyNutritionData}
      />
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
  discoveryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  discoveryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  discoveryText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '700',
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  gridCell: {
    flex: 1,
  },
  categories: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextSelected: {
    color: '#1A1A1A',
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
