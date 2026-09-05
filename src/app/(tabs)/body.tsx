import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeasurementModal } from '@/components/progress/MeasurementModal';
import { ProgressChart, type ChartSeries } from '@/components/progress/ProgressChart';
import {
  addMeasurement,
  deleteMeasurement,
  getMeasurements,
  updateMeasurement,
} from '@/services/progressService';
import { colors } from '@/utils/colors';
import { formatLogDate } from '@/utils/dates';
import type { BodyMeasurement } from '@/utils/types';

type MetricKey = keyof Omit<BodyMeasurement, 'id' | 'date'>;
type Selection = MetricKey | 'all';
type MeasurementInput = Omit<BodyMeasurement, 'id'>;

const METRICS: { key: MetricKey; label: string; unit: string; color: string; soft: string }[] = [
  { key: 'weight', label: 'Peso', unit: 'kg', color: '#2196F3', soft: '#E3F2FD' },
  { key: 'chest', label: 'Pectoral', unit: 'cm', color: '#FF9800', soft: '#FFF3E0' },
  { key: 'waist', label: 'Cintura', unit: 'cm', color: '#4CAF50', soft: '#E8F5E9' },
  { key: 'hips', label: 'Cadera', unit: 'cm', color: '#9C27B0', soft: '#F3E5F5' },
  { key: 'biceps', label: 'Bíceps', unit: 'cm', color: '#F44336', soft: '#FFEBEE' },
  { key: 'thighs', label: 'Muslo', unit: 'cm', color: '#00BCD4', soft: '#E0F7FA' },
];

export default function BodyScreen() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<BodyMeasurement | null>(null);
  const [selected, setSelected] = useState<Selection>('weight');

  useFocusEffect(
    useCallback(() => {
      getMeasurements().then(setMeasurements);
    }, [])
  );

  function openNew() {
    setEditing(null);
    setModalVisible(true);
  }

  function openEdit(m: BodyMeasurement) {
    setEditing(m);
    setModalVisible(true);
  }

  async function reload() {
    setMeasurements(await getMeasurements());
  }

  async function handleSave(input: MeasurementInput) {
    if (editing) {
      await updateMeasurement(editing.id, input);
    } else {
      await addMeasurement(input);
    }
    setModalVisible(false);
    await reload();
  }

  function handleDelete(m: BodyMeasurement) {
    Alert.alert(
      'Borrar medición',
      `¿Seguro que quieres borrar la medición del ${formatLogDate(m.date)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await deleteMeasurement(m.id);
            await reload();
          },
        },
      ]
    );
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
            <View key={m.id} style={styles.logCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatLogDate(m.date)}</Text>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => openEdit(m)} hitSlop={8}>
                    <Ionicons name="pencil-outline" size={19} color="#007AFF" />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(m)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={19} color="#ff4d4d" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.weightRow}>
                <Text style={styles.weightValue}>
                  {m.weight != null ? `${m.weight} kg` : '—'}
                </Text>
                <Text style={styles.weightLabel}>Peso</Text>
              </View>

              {METRICS.filter((mm) => mm.key !== 'weight').map((mm) => {
                const v = m[mm.key];
                if (v == null) return null;
                return (
                  <View key={mm.key} style={styles.measureRow}>
                    <View style={[styles.dot, { backgroundColor: mm.color }]} />
                    <Text style={styles.measureLabel}>{mm.label}</Text>
                    <Text style={styles.measureValue}>{v} cm</Text>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={openNew}>
        <Ionicons name="add" size={28} color="#1A1A1A" />
      </Pressable>

      <MeasurementModal
        visible={modalVisible}
        initial={editing}
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
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weightValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  weightLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  measureLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  measureValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
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
