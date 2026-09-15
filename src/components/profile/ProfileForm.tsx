import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FormScrollView } from '@/components/common/FormScrollView';
import { getOrCreateProfile, updateProfile } from '@/services/profileService';
import { colors } from '@/utils/colors';
import {
  calculateGoals,
  type ActivityLevel,
  type GoalType,
  type Gender,
} from '@/utils/nutritionCalculator';

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

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

export function ProfileForm() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [goalType, setGoalType] = useState<GoalType>('maintenance');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getOrCreateProfile().then((p) => {
      if (p.weight != null) setWeight(String(p.weight));
      if (p.height != null) setHeight(String(p.height));
      if (p.age != null) setAge(String(p.age));
      if (p.gender) setGender(p.gender);
      if (p.calcGoalType) setGoalType(p.calcGoalType);
      if (p.calcActivityLevel) setActivity(p.calcActivityLevel);
      if (p.goalCalories != null) setKcal(String(p.goalCalories));
      if (p.goalProtein != null) setProtein(String(p.goalProtein));
      if (p.goalCarbs != null) setCarbs(String(p.goalCarbs));
      if (p.goalFat != null) setFat(String(p.goalFat));
    });
  }, []);

  const wNum = parseNum(weight);
  const hNum = parseNum(height);
  const aNum = parseNum(age);
  const estimate =
    wNum != null && hNum != null && aNum != null
      ? calculateGoals({
          weight: wNum,
          height: hNum,
          age: aNum,
          gender,
          goalType,
          activityLevel: activity,
        })
      : null;

  function applyEstimate() {
    if (!estimate) return;
    setKcal(String(estimate.targetCalories));
    setProtein(String(estimate.protein));
    setCarbs(String(estimate.carbs));
    setFat(String(estimate.fat));
  }

  async function handleSave() {
    const w = parseNum(weight);
    const h = parseNum(height);
    const a = parseNum(age);
    if (w == null || h == null || a == null) {
      Alert.alert('Faltan datos', 'Peso, altura y edad son obligatorios.');
      return;
    }
    await updateProfile({
      weight: w,
      height: h,
      age: a,
      gender,
      goalCalories: parseNum(kcal),
      goalProtein: parseNum(protein),
      goalCarbs: parseNum(carbs),
      goalFat: parseNum(fat),
      calcGoalType: goalType,
      calcActivityLevel: activity,
      calcSpeed: null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <FormScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      {estimate && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estimación con tus datos</Text>
          <View style={styles.estimateGrid}>
            <View style={styles.estimateCell}>
              <Text style={styles.estimateLabel}>Metabolismo (BMR)</Text>
              <Text style={styles.estimateValue}>{estimate.bmr} kcal</Text>
            </View>
            <View style={styles.estimateCell}>
              <Text style={styles.estimateLabel}>Gasto diario (TDEE)</Text>
              <Text style={styles.estimateValue}>{estimate.tdee} kcal</Text>
            </View>
            <View style={[styles.estimateCell, styles.estimateCellTarget]}>
              <Text style={styles.estimateLabel}>Calorías objetivo</Text>
              <Text style={styles.estimateTargetValue}>{estimate.targetCalories} kcal</Text>
            </View>
            <View style={styles.estimateCell}>
              <Text style={styles.estimateLabel}>Proteína</Text>
              <Text style={styles.estimateValue}>{estimate.protein} g</Text>
            </View>
            <View style={styles.estimateCell}>
              <Text style={styles.estimateLabel}>Carbos</Text>
              <Text style={styles.estimateValue}>{estimate.carbs} g</Text>
            </View>
            <View style={styles.estimateCell}>
              <Text style={styles.estimateLabel}>Grasa</Text>
              <Text style={styles.estimateValue}>{estimate.fat} g</Text>
            </View>
          </View>
          {estimate.deficitSurplus !== 0 && (
            <Text style={styles.estimateNote}>
              {estimate.deficitSurplus < 0
                ? `Déficit de ${Math.abs(estimate.deficitSurplus)} kcal para definir`
                : `Superávit de ${estimate.deficitSurplus} kcal para volumen`}
            </Text>
          )}
          {estimate.warnings.map((w) => (
            <Text key={w} style={styles.estimateWarn}>
              ⚠️ {w}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Metas (kcal y macros)</Text>
      <Text style={styles.hint}>
        Tus objetivos actuales. Puedes editarlos a mano o pulsar «Usar estimación» para copiar el
        cálculo.
      </Text>

      <View style={styles.goalRow}>
        <View style={styles.goalCell}>
          <Text style={styles.label}>Calorías (kcal)</Text>
          <TextInput
            style={styles.input}
            value={kcal}
            onChangeText={setKcal}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.goalCell}>
          <Text style={styles.label}>Proteína (g)</Text>
          <TextInput
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>
      <View style={styles.goalRow}>
        <View style={styles.goalCell}>
          <Text style={styles.label}>Carbos (g)</Text>
          <TextInput
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.goalCell}>
          <Text style={styles.label}>Grasa (g)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>

      <Pressable
        style={[styles.secondaryBtn, !estimate && styles.btnDisabled]}
        onPress={applyEstimate}
        disabled={!estimate}>
        <Text style={styles.secondaryText}>
          {estimate ? `Usar estimación (${estimate.targetCalories} kcal)` : 'Usar estimación'}
        </Text>
      </Pressable>

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>{saved ? 'Guardado ✓' : 'Guardar'}</Text>
      </Pressable>
    </FormScrollView>
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
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 4,
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
    color: '#1A1A1A',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  estimateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estimateCell: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  estimateCellTarget: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
  },
  estimateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  estimateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  estimateTargetValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  estimateNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  estimateWarn: {
    fontSize: 12,
    color: '#B26A00',
  },
  goalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalCell: {
    flex: 1,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
});
