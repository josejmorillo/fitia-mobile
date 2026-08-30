import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeasurementModal } from '@/components/progress/MeasurementModal';
import { ProgressChart } from '@/components/progress/ProgressChart';
import {
  addMeasurement,
  deleteMeasurement,
  getMeasurements,
} from '@/services/progressService';
import { colors } from '@/utils/colors';
import { formatShortDate } from '@/utils/dates';
import type { BodyMeasurement } from '@/utils/types';

type MetricKey = keyof Omit<BodyMeasurement, 'id' | 'date'>;

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'weight', label: 'Peso', unit: 'kg' },
  { key: 'chest', label: 'Pecho', unit: 'cm' },
  { key: 'waist', label: 'Cintura', unit: 'cm' },
  { key: 'hips', label: 'Cadera', unit: 'cm' },
  { key: 'biceps', label: 'Bíceps', unit: 'cm' },
  { key: 'thighs', label: 'Muslo', unit: 'cm' },
];

export default function BodyScreen() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('weight');

  useFocusEffect(
    useCallback(() => {
      getMeasurements().then(setMeasurements);
    }, [])
  );

  async function handleSave(input: Omit<BodyMeasurement, 'id'>) {
    await addMeasurement(input);
    setMeasurements(await getMeasurements());
  }

  async function handleDelete(id: number) {
    await deleteMeasurement(id);
    setMeasurements(await getMeasurements());
  }

  const availableMetrics = METRICS.filter(
    (m) => m.key === 'weight' || measurements.some((meas) => meas[m.key] != null)
  );
  const metric = METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0];

  const chartPoints = measurements
    .filter((m) => m[selectedMetric] != null)
    .map((m) => ({ label: formatShortDate(m.date), value: m[selectedMetric]! }));

  const list = [...measurements].reverse();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Cuerpo</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evolución · {metric.label}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chips}
            contentContainerStyle={styles.chipsContent}>
            {availableMetrics.map((m) => {
              const selected = m.key === selectedMetric;
              return (
                <Pressable
                  key={m.key}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setSelectedMetric(m.key)}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ProgressChart points={chartPoints} unit={metric.unit} />
        </View>

        {list.length === 0 ? (
          <Text style={styles.empty}>Aún no hay mediciones. Pulsa + para añadir la primera.</Text>
        ) : (
          list.map((m) => (
            <View key={m.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowDate}>{formatShortDate(m.date)}</Text>
                <Text style={styles.rowWeight}>{m.weight} kg</Text>
                <Text style={styles.rowDetails}>
                  {[m.chest, m.waist, m.hips, m.biceps, m.thighs]
                    .filter((v) => v != null)
                    .map((v) => `${v}cm`)
                    .join(' · ')}
                </Text>
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => handleDelete(m.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#1A1A1A" />
      </Pressable>

      <MeasurementModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  chips: {
    marginBottom: 8,
  },
  chipsContent: {
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.background,
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
  empty: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowInfo: {
    flex: 1,
  },
  rowDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  rowWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rowDetails: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
