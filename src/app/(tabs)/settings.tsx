import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOrCreateProfile, updateProfile } from '@/services/profileService';
import { deleteApiKey, getApiKeys, saveApiKey } from '@/services/keys';
import { exportBackup } from '@/services/backupService';
import { importFromText, pickJsonFile } from '@/services/shareService';
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
  const [hasGroq, setHasGroq] = useState(false);
  const [hasMistral, setHasMistral] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [savedGoals, setSavedGoals] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  useEffect(() => {
    getOrCreateProfile().then((p) => {
      if (p.weight != null) setWeight(String(p.weight));
      if (p.height != null) setHeight(String(p.height));
      if (p.age != null) setAge(String(p.age));
      if (p.gender) setGender(p.gender);
      if (p.calcGoalType) setGoalType(p.calcGoalType);
      if (p.calcActivityLevel) setActivity(p.calcActivityLevel);
      if (p.goalCalories != null) {
        setSavedGoals({
          calories: p.goalCalories,
          protein: p.goalProtein ?? 0,
          carbs: p.goalCarbs ?? 0,
          fat: p.goalFat ?? 0,
        });
      }
    });
    getApiKeys().then((k) => {
      setHasGroq(k.groq != null);
      setHasMistral(k.mistral != null);
    });
  }, []);

  function parseNum(s: string): number | null {
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

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
    setSavedGoals({
      calories: goals.targetCalories,
      protein: goals.protein,
      carbs: goals.carbs,
      fat: goals.fat,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSaveKeys() {
    if (groqKey.trim()) {
      await saveApiKey('groq', groqKey);
      setHasGroq(true);
    }
    if (mistralKey.trim()) {
      await saveApiKey('mistral', mistralKey);
      setHasMistral(true);
    }
    setGroqKey('');
    setMistralKey('');
    setKeysSaved(true);
    setTimeout(() => setKeysSaved(false), 2000);
  }

  async function handleDeleteKey(provider: 'groq' | 'mistral') {
    await deleteApiKey(provider);
    if (provider === 'groq') setHasGroq(false);
    else setHasMistral(false);
  }

  async function handleExportBackup() {
    try {
      await exportBackup();
    } catch {
      Alert.alert('Error', 'No se pudo exportar la copia de seguridad.');
    }
  }

  async function handleImportFile() {
    try {
      const text = await pickJsonFile();
      if (text == null) return;
      const message = await importFromText(text);
      Alert.alert('Importación completada', message);
    } catch (e) {
      Alert.alert(
        'No se pudo importar',
        e instanceof Error ? e.message : 'El archivo no es válido.'
      );
    }
  }

  function showGroqInfo() {
    Alert.alert(
      'Clave de Groq',
      'Para obtenerla gratis (sin tarjeta):\n\n1. Ve a console.groq.com\n2. Regístrate\n3. En "API Keys" pulsa "Create API Key"\n4. Copia la clave (empieza por gsk_)'
    );
  }

  function showMistralInfo() {
    Alert.alert(
      'Clave de Mistral',
      'Para obtenerla gratis (sin tarjeta):\n\n1. Ve a console.mistral.ai\n2. Regístrate\n3. En "API Keys" crea una clave\n4. Cópiala'
    );
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

        {savedGoals && (
          <View style={styles.goalsCard}>
            <Text style={styles.goalsCardTitle}>Objetivos guardados</Text>
            <Text style={styles.goalsHint}>Lo que tienes fijado ahora mismo (aparece en tu Plan).</Text>
            <View style={styles.goalsRow}>
              <View style={styles.goalBox}>
                <Text style={styles.goalValue}>{savedGoals.calories}</Text>
                <Text style={styles.goalLabel}>kcal</Text>
              </View>
              <View style={styles.goalBox}>
                <Text style={[styles.goalValue, { color: colors.protein }]}>
                  {savedGoals.protein}g
                </Text>
                <Text style={styles.goalLabel}>Proteína</Text>
              </View>
              <View style={styles.goalBox}>
                <Text style={[styles.goalValue, { color: colors.carbs }]}>
                  {savedGoals.carbs}g
                </Text>
                <Text style={styles.goalLabel}>Carbos</Text>
              </View>
              <View style={styles.goalBox}>
                <Text style={[styles.goalValue, { color: colors.fat }]}>{savedGoals.fat}g</Text>
                <Text style={styles.goalLabel}>Grasa</Text>
              </View>
            </View>
          </View>
        )}

        {estimate && (
          <View style={styles.goalsCard}>
            <Text style={styles.goalsCardTitle}>Estimación con tus datos</Text>
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

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>
            {saved
              ? 'Guardado ✓'
              : estimate
                ? `Aplicar ${estimate.targetCalories} kcal y macros`
                : 'Calcular y guardar objetivos'}
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>API de IA (opcional)</Text>
        <Text style={styles.hint}>
          Claves para la búsqueda de alimentos por IA. Se guardan de forma segura en tu dispositivo.
          Puedes conseguirlas gratis en console.groq.com y console.mistral.ai.
        </Text>

        <View style={styles.keyHeader}>
          <Text style={[styles.label, styles.keyLabel]}>Clave de Groq</Text>
          {hasGroq && <Text style={styles.savedBadge}>✓ Guardada</Text>}
          <Pressable onPress={showGroqInfo} hitSlop={8}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
        <View style={styles.keyInputRow}>
          <TextInput
            style={[styles.input, styles.keyInput]}
            value={groqKey}
            onChangeText={setGroqKey}
            placeholder={hasGroq ? 'Introduce una nueva clave…' : 'gsk_...'}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          {hasGroq && (
            <Pressable onPress={() => handleDeleteKey('groq')} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
            </Pressable>
          )}
        </View>

        <View style={styles.keyHeader}>
          <Text style={[styles.label, styles.keyLabel]}>Clave de Mistral</Text>
          {hasMistral && <Text style={styles.savedBadge}>✓ Guardada</Text>}
          <Pressable onPress={showMistralInfo} hitSlop={8}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
        <View style={styles.keyInputRow}>
          <TextInput
            style={[styles.input, styles.keyInput]}
            value={mistralKey}
            onChangeText={setMistralKey}
            placeholder={hasMistral ? 'Introduce una nueva clave…' : '...'}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          {hasMistral && (
            <Pressable onPress={() => handleDeleteKey('mistral')} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
            </Pressable>
          )}
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSaveKeys}>
          <Text style={styles.saveText}>{keysSaved ? 'Claves guardadas ✓' : 'Guardar claves'}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Datos y copias de seguridad</Text>
        <Text style={styles.hint}>
          Exporta tu base de datos (alimentos, recetas, diario, mediciones y perfil) a un archivo
          JSON para hacer una copia manual o pasarla a otro dispositivo. También puedes importar un
          alimento o receta que te hayan compartido: toca el archivo .json y elige NutriFit, o usa
          el botón Importar.
        </Text>

        <View style={styles.dataRow}>
          <Pressable style={[styles.dataBtn, styles.dataBtnPrimary]} onPress={handleExportBackup}>
            <Ionicons name="share-outline" size={18} color="#1A1A1A" />
            <Text style={styles.dataBtnText}>Exportar base de datos</Text>
          </Pressable>
          <Pressable style={[styles.dataBtn, styles.dataBtnGhost]} onPress={handleImportFile}>
            <Ionicons name="download-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.dataBtnGhostText}>Importar archivo</Text>
          </Pressable>
        </View>
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
  keyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 6,
  },
  keyLabel: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
  },
  savedBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  keyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  keyInput: {
    flex: 1,
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
  goalsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    gap: 8,
  },
  goalsCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  goalsHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  goalsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  goalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  goalLabel: {
    fontSize: 10,
    color: colors.textSecondary,
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
  dataRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dataBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
  },
  dataBtnPrimary: {
    backgroundColor: colors.primary,
  },
  dataBtnGhost: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dataBtnText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  dataBtnGhostText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
