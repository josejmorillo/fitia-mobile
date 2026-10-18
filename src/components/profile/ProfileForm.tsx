import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { FormScrollView } from '@/components/common/FormScrollView';
import { getOrCreateProfile, updateProfile } from '@/services/profileService';
import { colors } from '@/utils/colors';
import {
  calculateGoals,
  type ActivityLevel,
  type GoalType,
  type Gender,
} from '@/utils/nutritionCalculator';
import {
  CARB_RATION_OPTIONS,
  DEFAULT_CARB_RATION_GRAMS,
  parseDecimalInput,
} from '@/utils/rations';
import type { UserProfile } from '@/utils/types';

type Option<T extends string> = { key: T; label: string };

export type ProfileFormMode = 'objetivo' | 'datos';

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

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder ?? '0'}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

export function ProfileForm({ mode }: { mode: ProfileFormMode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
  const [diabetesMode, setDiabetesMode] = useState(false);
  const [carbRationGrams, setCarbRationGrams] = useState(String(DEFAULT_CARB_RATION_GRAMS));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getOrCreateProfile().then((p) => {
      setProfile(p);
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
      setDiabetesMode(p.diabetesModeEnabled);
      setCarbRationGrams(String(p.carbRationGrams));
    });
  }, []);

  const wNum = parseNum(weight);
  const hNum = parseNum(height);
  const aNum = parseNum(age);
  const hasPersonalData = wNum != null && hNum != null && aNum != null;
  const estimate = hasPersonalData
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

  function handleToggleDiabetes(next: boolean) {
    setDiabetesMode(next);
    if (next) {
      const gramsLabel = carbRationGrams.trim() || String(DEFAULT_CARB_RATION_GRAMS);
      Alert.alert(
        'Raciones de hidratos de carbono',
        `R = ración de hidratos de carbono. 1 R = ${gramsLabel} g de carbohidratos. Es solo informativo y no sustituye las indicaciones de tu médico o endocrino.`
      );
    }
  }

  async function handleSave() {
    const base = profile;
    if (mode === 'datos') {
      if (wNum == null || hNum == null || aNum == null) {
        Alert.alert('Faltan datos', 'Peso, altura y edad son obligatorios.');
        return;
      }
    }
    const rationGrams = parseDecimalInput(carbRationGrams);
    if (diabetesMode && (rationGrams == null || rationGrams <= 0)) {
      Alert.alert(
        'Valor no válido',
        'Introduce un valor válido de gramos por ración (ej. 12).'
      );
      return;
    }
    await updateProfile({
      // Datos personales: se editan en la pestaña Datos.
      weight: mode === 'datos' ? parseNum(weight) : (base?.weight ?? null),
      height: mode === 'datos' ? parseNum(height) : (base?.height ?? null),
      age: mode === 'datos' ? parseNum(age) : (base?.age ?? null),
      gender: mode === 'datos' ? gender : (base?.gender ?? null),
      // Objetivos: se editan en la pestaña Objetivo.
      goalCalories: mode === 'objetivo' ? parseNum(kcal) : (base?.goalCalories ?? null),
      goalProtein: mode === 'objetivo' ? parseNum(protein) : (base?.goalProtein ?? null),
      goalCarbs: mode === 'objetivo' ? parseNum(carbs) : (base?.goalCarbs ?? null),
      goalFat: mode === 'objetivo' ? parseNum(fat) : (base?.goalFat ?? null),
      calcGoalType: mode === 'objetivo' ? goalType : (base?.calcGoalType ?? null),
      calcActivityLevel: mode === 'objetivo' ? activity : (base?.calcActivityLevel ?? null),
      calcSpeed: base?.calcSpeed ?? null,
      // Modo diabetes: se edita en la pestaña Datos.
      diabetesModeEnabled:
        mode === 'datos' ? diabetesMode : (base?.diabetesModeEnabled ?? false),
      carbRationGrams:
        mode === 'datos'
          ? rationGrams != null && rationGrams > 0
            ? rationGrams
            : DEFAULT_CARB_RATION_GRAMS
          : (base?.carbRationGrams ?? DEFAULT_CARB_RATION_GRAMS),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <FormScrollView style={styles.container} contentContainerStyle={styles.content}>
      {mode === 'objetivo' ? (
        <>
          <Text style={styles.sectionTitle}>Estimación</Text>
          {estimate ? (
            <View style={styles.card}>
              <View style={styles.hero}>
                <Text style={styles.heroLabel}>Calorías objetivo</Text>
                <View style={styles.heroRow}>
                  <Text style={styles.heroValue}>{estimate.targetCalories}</Text>
                  <Text style={styles.heroUnit}>kcal</Text>
                </View>
                {estimate.deficitSurplus !== 0 && (
                  <Text style={styles.heroNote}>
                    {estimate.deficitSurplus < 0
                      ? `Déficit de ${Math.abs(estimate.deficitSurplus)} kcal para definir`
                      : `Superávit de ${estimate.deficitSurplus} kcal para volumen`}
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Metabolismo (BMR)</Text>
                  <Text style={styles.statValue}>{estimate.bmr} kcal</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Gasto diario (TDEE)</Text>
                  <Text style={styles.statValue}>{estimate.tdee} kcal</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {[
                { label: 'Proteína', value: estimate.protein, color: colors.protein, factor: 4 },
                { label: 'Carbos', value: estimate.carbs, color: colors.carbs, factor: 4 },
                { label: 'Grasa', value: estimate.fat, color: colors.fat, factor: 9 },
              ].map((m) => {
                const pct =
                  estimate.targetCalories > 0
                    ? Math.min(((m.value * m.factor) / estimate.targetCalories) * 100, 100)
                    : 0;
                return (
                  <View key={m.label} style={styles.macroRow}>
                    <Text style={styles.macroLabel}>{m.label}</Text>
                    <Text style={styles.macroValue}>{m.value} g</Text>
                    <View style={styles.macroTrack}>
                      <View
                        style={[styles.macroFill, { width: `${pct}%`, backgroundColor: m.color }]}
                      />
                    </View>
                  </View>
                );
              })}

              {estimate.warnings.map((w) => (
                <Text key={w} style={styles.estimateWarn}>
                  ⚠️ {w}
                </Text>
              ))}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.help}>
                Completa tus datos personales en la pestaña «Datos» para ver la estimación.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Objetivo</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Tipo</Text>
            <ChipGroup options={GOAL_OPTIONS} value={goalType} onChange={setGoalType} />
            <Text style={styles.label}>Nivel de actividad</Text>
            <ChipGroup options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
          </View>

          <Text style={styles.sectionTitle}>Tus metas</Text>
          <View style={styles.card}>
            <Text style={styles.help}>
              Tus objetivos actuales. Puedes editarlos a mano o copiar la estimación.
            </Text>
            <View style={styles.row}>
              <Field label="Calorías (kcal)" value={kcal} onChange={setKcal} />
              <Field label="Proteína (g)" value={protein} onChange={setProtein} />
            </View>
            <View style={styles.row}>
              <Field label="Carbos (g)" value={carbs} onChange={setCarbs} />
              <Field label="Grasa (g)" value={fat} onChange={setFat} />
            </View>
            <Pressable
              style={[styles.secondaryBtn, !estimate && styles.btnDisabled]}
              onPress={applyEstimate}
              disabled={!estimate}>
              <Text style={styles.secondaryText}>
                {estimate
                  ? `Usar estimación (${estimate.targetCalories} kcal)`
                  : 'Usar estimación'}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Field label="Peso (kg)" value={weight} onChange={setWeight} placeholder="75" />
              <Field label="Altura (cm)" value={height} onChange={setHeight} placeholder="175" />
            </View>
            <View style={styles.row}>
              <Field label="Edad" value={age} onChange={setAge} placeholder="30" />
              <View style={styles.cell} />
            </View>
            <Text style={styles.label}>Sexo</Text>
            <ChipGroup options={GENDER_OPTIONS} value={gender} onChange={setGender} />
          </View>

          <Text style={styles.sectionTitle}>Raciones de hidratos de carbono</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Modo diabetes</Text>
                <Text style={styles.help}>
                  Muestra las raciones de hidratos de carbono (R) junto a los carbohidratos.
                </Text>
              </View>
              <Switch
                value={diabetesMode}
                onValueChange={handleToggleDiabetes}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {diabetesMode && (
              <>
                <Text style={styles.label}>Gramos por ración</Text>
                <TextInput
                  style={styles.input}
                  value={carbRationGrams}
                  onChangeText={setCarbRationGrams}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={colors.textTertiary}
                />
                <View style={[styles.chips, styles.rationChips]}>
                  {CARB_RATION_OPTIONS.map((g) => {
                    const selected = carbRationGrams === String(g);
                    return (
                      <Pressable
                        key={g}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setCarbRationGrams(String(g))}>
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {g} g
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.help}>
                  1 R = {carbRationGrams.trim() || DEFAULT_CARB_RATION_GRAMS} g de carbohidratos.
                  Solo informativo.
                </Text>
              </>
            )}
          </View>
        </>
      )}

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
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cell: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  help: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
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
    backgroundColor: colors.background,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rationChips: {
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.background,
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
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  hero: {
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  heroValue: {
    fontSize: 46,
    fontWeight: '800',
    color: colors.text,
  },
  heroUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heroNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  macroLabel: {
    width: 62,
    fontSize: 12,
    color: colors.textSecondary,
  },
  macroValue: {
    width: 54,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  macroTrack: {
    flex: 1,
    height: 5,
    backgroundColor: colors.track,
    borderRadius: 999,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 999,
  },
  estimateWarn: {
    fontSize: 12,
    color: '#B26A00',
    marginTop: 2,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
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
    marginTop: 16,
  },
  saveText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
});
