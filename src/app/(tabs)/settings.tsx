import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOrCreateProfile, updateProfile } from '@/services/profileService';
import { getApiKeys, saveApiKeys } from '@/services/keys';
import { colors } from '@/utils/colors';
import { calculateGoals, type ActivityLevel, type GoalType, type Gender } from '@/utils/nutritionCalculator';

type Option<T extends string> = { key: T; label: string };

const GENDER_OPTIONS: Option<Gender>[] = [
  { key: 'male', label: 'Hombre' },
  { key: 'female', label: 'Mujer' },
  { key: 'other', label: 'Otro' },
];

const GOAL_OPTIONS: Option<GoalType>[] = [
  { key: 'loss', label: 'Definir' },
  { key: 'maintenance', label: 'Mantener' },
  { key: 'gain', label: 'Volumen' },
];

const ACTIVITY_OPTIONS: Option<ActivityLevel>[] = [
  { key: 'sedentary', label: 'Sedentario' },
  { key: 'light', label: 'Ligero' },
  { key: 'moderate', label: 'Moderado' },
  { key: 'very', label: 'Muy activo' },
  { key: 'extra', label: 'Extra' },
];

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(opt.key)}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [goalType, setGoalType] = useState<GoalType>('maintenance');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [saved, setSaved] = useState(false);
  const [groqKey, setGroqKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [keysSaved, setKeysSaved] = useState(false);

  useEffect(() => {
    getOrCreateProfile().then((p) => {
      if (p.weight != null) setWeight(String(p.weight));
      if (p.height != null) setHeight(String(p.height));
      if (p.age != null) setAge(String(p.age));
      if (p.gender) setGender(p.gender);
      if (p.calcGoalType) setGoalType(p.calcGoalType);
      if (p.calcActivityLevel) setActivity(p.calcActivityLevel);
    });
    getApiKeys().then((k) => {
      setGroqKey(k.groq ?? '');
      setMistralKey(k.mistral ?? '');
    });
  }, []);

  function parseNum(s: string): number | null {
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  async function handleSave() {
    const w = parseNum(weight);
    const h = parseNum(height);
    const a = parseNum(age);
    if (w == null || h == null || a == null) return;

    const goals = calculateGoals({
      weight: w,
      height: h,
      age: a,
      gender,
      goalType,
      activityLevel: activity,
    });

    await updateProfile({
      weight: w,
      height: h,
      age: a,
      gender,
      goalCalories: goals.targetCalories,
      goalProtein: goals.protein,
      goalCarbs: goals.carbs,
      goalFat: goals.fat,
      calcGoalType: goalType,
      calcActivityLevel: activity,
      calcSpeed: null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSaveKeys() {
    await saveApiKeys({ groq: groqKey || null, mistral: mistralKey || null });
    setKeysSaved(true);
    setTimeout(() => setKeysSaved(false), 2000);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.sectionTitle}>Datos personales</Text>

        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="Ej. 75"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={styles.label}>Altura (cm)</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
          placeholder="Ej. 175"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={styles.label}>Edad</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholder="Ej. 30"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={styles.label}>Sexo</Text>
        <ChipGroup options={GENDER_OPTIONS} value={gender} onChange={setGender} />

        <Text style={styles.sectionTitle}>Objetivo</Text>
        <ChipGroup options={GOAL_OPTIONS} value={goalType} onChange={setGoalType} />

        <Text style={styles.label}>Nivel de actividad</Text>
        <ChipGroup options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>{saved ? 'Guardado ✓' : 'Calcular y guardar objetivos'}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>API de IA (opcional)</Text>
        <Text style={styles.hint}>
          Claves para la búsqueda de alimentos por IA. Se guardan de forma segura en tu dispositivo.
          Puedes conseguirlas gratis en console.groq.com y console.mistral.ai.
        </Text>

        <Text style={styles.label}>Clave de Groq</Text>
        <TextInput
          style={styles.input}
          value={groqKey}
          onChangeText={setGroqKey}
          placeholder="gsk_..."
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Clave de Mistral</Text>
        <TextInput
          style={styles.input}
          value={mistralKey}
          onChangeText={setMistralKey}
          placeholder="..."
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable style={styles.saveBtn} onPress={handleSaveKeys}>
          <Text style={styles.saveText}>{keysSaved ? 'Claves guardadas ✓' : 'Guardar claves'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
