import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeasurementModal } from '@/components/progress/MeasurementModal';
import { ProgressChart, type ChartSeries } from '@/components/progress/ProgressChart';
import {
  addMeasurement,
  deleteMeasurement,
  getMeasurements,
} from '@/services/progressService';
import { colors } from '@/utils/colors';
import { formatShortDate } from '@/utils/dates';
import type { BodyMeasurement } from '@/utils/types';

type MetricKey = keyof Omit<BodyMeasurement, 'id' | 'date'>;
type Selection = MetricKey | 'all';

const METRICS: { key: MetricKey; label: string; unit: string; color: string; soft: string }[] = [
  { key: 'weight', label: 'Peso', unit: 'kg', color: '#2196F3', soft: '#E3F2FD' },
  { key: 'chest', label: 'Pecho', unit: 'cm', color: '#FF9800', soft: '#FFF3E0' },
  { key: 'waist', label: 'Cintura', unit: 'cm', color: '#4CAF50', soft: '#E8F5E9' },
  { key: 'hips', label: 'Cadera', unit: 'cm', color: '#9C27B0', soft: '#F3E5F5' },
  { key: 'biceps', label: 'Bíceps', unit: 'cm', color: '#F44336', soft: '#FFEBEE' },
  { key: 'thighs', label: 'Muslo', unit: 'cm', color: '#00BCD4', soft: '#E0F7FA' },
];

export default function BodyScreen() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Selection>('weight');

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
  const showAll = availableMetrics.length >= 2;

  const pointsFor = (key: MetricKey) =>
    measurements
      .filter((m) => m[key] != null)
      .map((m) => ({ label: m.date, value: m[key]! }));

  let series: ChartSeries[];
  let unit: string;
  let legend: { label: string; color: string }[] | undefined;

  if (selected === 'all') {
    series = availableMetrics.map((m) => ({ color: m.color, points: pointsFor(m.key) }));
    unit = '';
    legend = availableMetrics.map((m) => ({ label: m.label, color: m.color }));
  } else {
    const m = METRICS.find((mm) => mm.key === selected) ?? METRICS[0];
    series = [{ color: m.color, points: pointsFor(m.key) }];
    unit = m.unit;
  }

  const titleLabel =
    selected === 'all' ? 'Todas' : (METRICS.find((m) => m.key === selected)?.label ?? 'Peso');

  const list = [...measurements].reverse();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Cuerpo</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evolución · {titleLabel}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chips}
            contentContainerStyle={styles.chipsContent}>
            {showAll && (
              <Pressable
                style={[
                  styles.chip,
                  { backgroundColor: selected === 'all' ? colors.primary : colors.background },
                ]}
                onPress={() => setSelected('all')}>
                <Text
                  style={[
                    styles.chipText,
                    { color: selected === 'all' ? '#1A1A1A' : colors.text },
                  ]}>
                  Todas
                </Text>
              </Pressable>
            )}
            {availableMetrics.map((m) => {
              const isSelected = m.key === selected;
              return (
                <Pressable
                  key={m.key}
                  style={[styles.chip, { backgroundColor: isSelected ? m.color : m.soft }]}
                  onPress={() => setSelected(m.key)}>
                  <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : m.color }]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ProgressChart series={series} unit={unit} legend={legend} />
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
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
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
