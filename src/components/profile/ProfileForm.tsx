import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { FormScrollView } from '@/components/common/FormScrollView';
import {
  getOrCreateProfile,
  updateCarbRationGrams,
  updateDiabetesMode,
  updateProfile,
} from '@/services/profileService';
import { colors } from '@/utils/colors';
import {
  goalsFromEstimate,
  macroCalories,
  reconcileMacro,
  type GoalMacroField,
  type Goals,
} from '@/utils/goalsMath';
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

/**
 * Pulsación con auto-repetición y aceleración: el primer paso es inmediato y,
 * mientras se mantiene pulsado, se repite cada vez más rápido.
 */
function useHoldRepeat(onStep: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delay = useRef(350);
  const stepRef = useRef(onStep);

  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  function clear() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function schedule() {
    timer.current = setTimeout(() => {
      stepRef.current();
      delay.current = Math.max(60, Math.round(delay.current * 0.75));
      schedule();
    }, delay.current);
  }

  function start() {
    clear();
    delay.current = 350;
    stepRef.current();
    schedule();
  }

  function stop() {
    clear();
    delay.current = 350;
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { start, stop };
}

function MacroStepperRow({
  label,
  value,
  factor,
  totalKcal,
  color,
  onStep,
}: {
  label: string;
  value: number;
  factor: number;
  totalKcal: number;
  color: string;
  onStep: (delta: number) => void;
}) {
  const dec = useHoldRepeat(() => onStep(-1));
  const inc = useHoldRepeat(() => onStep(1));
  const kcal = value * factor;
  const pct = totalKcal > 0 ? Math.min((kcal / totalKcal) * 100, 100) : 0;

  return (
    <View style={styles.macroStepperRow}>
      <Text style={styles.macroStepperLabel}>{label}</Text>
      <Pressable
        style={styles.macroStepBtn}
        onPressIn={dec.start}
        onPressOut={dec.stop}
        hitSlop={6}>
        <Ionicons name="remove" size={15} color={colors.primaryDark} />
      </Pressable>
      <Text style={styles.macroStepperValue}>{value} g</Text>
      <Pressable
        style={styles.macroStepBtn}
        onPressIn={inc.start}
        onPressOut={inc.stop}
        hitSlop={6}>
        <Ionicons name="add" size={15} color={colors.primaryDark} />
      </Pressable>
      <View style={styles.macroStepperTrack}>
        <View style={[styles.macroStepperFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MacroBars({
  protein,
  carbs,
  fat,
  totalKcal,
}: {
  protein: number;
  carbs: number;
  fat: number;
  totalKcal: number;
}) {
  const rows = [
    { label: 'Proteína', grams: protein, kcal: protein * 4, color: colors.protein },
    { label: 'Carbos', grams: carbs, kcal: carbs * 4, color: colors.carbs },
    { label: 'Grasa', grams: fat, kcal: fat * 9, color: colors.fat },
  ];
  return (
    <>
      {rows.map((m) => {
        const pct = totalKcal > 0 ? Math.min((m.kcal / totalKcal) * 100, 100) : 0;
        return (
          <View key={m.label} style={styles.macroRow}>
            <Text style={styles.macroLabel}>{m.label}</Text>
            <Text style={styles.macroValue}>{m.grams} g</Text>
            <View style={styles.macroTrack}>
              <View style={[styles.macroFill, { width: `${pct}%`, backgroundColor: m.color }]} />
            </View>
          </View>
        );
      })}
    </>
  );
}

export function ProfileForm({ mode }: { mode: ProfileFormMode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [goalType, setGoalType] = useState<GoalType>('maintenance');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goals, setGoals] = useState<Goals>({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
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
      const protein0 = p.goalProtein ?? 0;
      const carbs0 = p.goalCarbs ?? 0;
      const fat0 = p.goalFat ?? 0;
      const derivedKcal = macroCalories(protein0, carbs0, fat0);
      setGoals({
        protein: protein0,
        carbs: carbs0,
        fat: fat0,
        kcal: derivedKcal > 0 ? derivedKcal : (p.goalCalories ?? 0),
      });
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

  const estimateGoals = estimate ? goalsFromEstimate(estimate) : null;
  const isManual =
    !estimateGoals ||
    goals.protein !== estimateGoals.protein ||
    goals.carbs !== estimateGoals.carbs ||
    goals.fat !== estimateGoals.fat;

  function applyEstimate() {
    if (!estimate) return;
    setGoals(goalsFromEstimate(estimate));
  }

  const stepMacro = (field: GoalMacroField, delta: number) =>
    setGoals((prev) => reconcileMacro(field, Math.max(0, prev[field] + delta), prev));

  async function persistRationGrams(value: string) {
    const grams = parseDecimalInput(value);
    if (grams == null || grams <= 0) return;
    try {
      await updateCarbRationGrams(grams);
    } catch (e) {
      console.error('[profile] no se pudieron guardar los gramos por ración:', e);
    }
  }

  async function handleToggleDiabetes(next: boolean) {
    setDiabetesMode(next);
    if (next) {
      const gramsLabel = carbRationGrams.trim() || String(DEFAULT_CARB_RATION_GRAMS);
      Alert.alert(
        'Raciones de hidratos de carbono',
        `R = ración de hidratos de carbono. 1 R = ${gramsLabel} g de carbohidratos. Es solo informativo y no sustituye las indicaciones de tu médico o endocrino.`
      );
    }
    try {
      await updateDiabetesMode(next);
    } catch (e) {
      console.error('[profile] no se pudo guardar el modo diabetes:', e);
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
      goalCalories: mode === 'objetivo' ? goals.kcal : (base?.goalCalories ?? null),
      goalProtein: mode === 'objetivo' ? goals.protein : (base?.goalProtein ?? null),
      goalCarbs: mode === 'objetivo' ? goals.carbs : (base?.goalCarbs ?? null),
      goalFat: mode === 'objetivo' ? goals.fat : (base?.goalFat ?? null),
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
          <Text style={styles.sectionTitle}>Objetivo</Text>
          <View style={styles.card}>
            <View style={styles.hero}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroLabel}>Objetivo</Text>
                <Text
                  style={[
                    styles.badge,
                    isManual ? styles.badgeManual : styles.badgeRecommended,
                  ]}>
                  {isManual ? 'Manual' : 'Recomendado'}
                </Text>
              </View>
              <View style={styles.heroRow}>
                <Text style={styles.heroValue}>{goals.kcal}</Text>
                <Text style={styles.heroUnit}>kcal</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <MacroStepperRow
              label="Proteína"
              value={goals.protein}
              factor={4}
              totalKcal={goals.kcal}
              color={colors.protein}
              onStep={(d) => stepMacro('protein', d)}
            />
            <MacroStepperRow
              label="Carbos"
              value={goals.carbs}
              factor={4}
              totalKcal={goals.kcal}
              color={colors.carbs}
              onStep={(d) => stepMacro('carbs', d)}
            />
            <MacroStepperRow
              label="Grasa"
              value={goals.fat}
              factor={9}
              totalKcal={goals.kcal}
              color={colors.fat}
              onStep={(d) => stepMacro('fat', d)}
            />

            <Text style={[styles.help, styles.metasHelp, isManual && styles.helpManual]}>
              {isManual
                ? 'Valores manuales: pueden no coincidir con la estimación científica.'
                : 'Valores según la estimación recomendada.'}
            </Text>

            <Pressable
              style={[styles.secondaryBtn, !estimate && styles.btnDisabled]}
              onPress={applyEstimate}
              disabled={!estimate}>
              <Text style={styles.secondaryText}>
                {estimate
                  ? `Usar estimación recomendada (${estimate.targetCalories} kcal)`
                  : 'Usar estimación'}
              </Text>
            </Pressable>
          </View>

          {!estimate ? (
            <View style={styles.card}>
              <Text style={styles.help}>
                Completa tus datos personales en la pestaña «Datos» para ver la estimación.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                {isManual ? 'Estimación recomendada' : 'Gasto energético'}
              </Text>
              <View style={styles.card}>
                {isManual && (
                  <>
                    <View style={styles.hero}>
                      <Text style={styles.heroLabel}>Estimación recomendada</Text>
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
                  </>
                )}

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

                {isManual && (
                  <>
                    <View style={styles.divider} />
                    <MacroBars
                      protein={estimate.protein}
                      carbs={estimate.carbs}
                      fat={estimate.fat}
                      totalKcal={estimate.targetCalories}
                    />
                  </>
                )}

                {estimate.warnings.map((w) => (
                  <Text key={w} style={styles.estimateWarn}>
                    ⚠️ {w}
                  </Text>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Tipo de objetivo</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Tipo</Text>
            <ChipGroup options={GOAL_OPTIONS} value={goalType} onChange={setGoalType} />
            <Text style={styles.label}>Nivel de actividad</Text>
            <ChipGroup options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
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
                  onEndEditing={() => {
                    void persistRationGrams(carbRationGrams);
                  }}
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
                        onPress={() => {
                          setCarbRationGrams(String(g));
                          void persistRationGrams(String(g));
                        }}>
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
  helpManual: {
    color: '#B26A00',
    fontWeight: '700',
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
  macroStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  macroStepperLabel: {
    width: 56,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  macroStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroStepperValue: {
    width: 50,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  macroStepperTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.track,
    borderRadius: 9999,
    overflow: 'hidden',
    marginLeft: 4,
  },
  macroStepperFill: {
    height: '100%',
    borderRadius: 9999,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeManual: {
    color: '#B26A00',
    backgroundColor: 'rgba(178, 106, 0, 0.12)',
  },
  badgeRecommended: {
    color: colors.carbs,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  metasHelp: {
    marginTop: 4,
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
