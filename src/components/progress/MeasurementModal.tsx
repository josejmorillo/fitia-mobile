import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '@/utils/colors';
import { formatDateFull, parseDateString, todayString, toDateString } from '@/utils/dates';
import type { BodyMeasurement } from '@/utils/types';

type MeasurementInput = Omit<BodyMeasurement, 'id'>;

interface MeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: MeasurementInput) => void;
}

function Field({
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
    <View style={styles.cell}>
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

export function MeasurementModal({ visible, onClose, onSave }: MeasurementModalProps) {
  const [date, setDate] = useState(todayString());
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [thighs, setThighs] = useState('');
  const [biceps, setBiceps] = useState('');
  const [chest, setChest] = useState('');
  const [wasVisible, setWasVisible] = useState(false);

  if (visible && !wasVisible) {
    setWasVisible(true);
    setDate(todayString());
    setWeight('');
    setWaist('');
    setHips('');
    setThighs('');
    setBiceps('');
    setChest('');
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  function openDatePicker() {
    DateTimePickerAndroid.open({
      value: parseDateString(date),
      mode: 'date',
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          setDate(toDateString(selectedDate));
        }
      },
    });
  }

  function parseNum(s: string): number | null {
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  function handleSave() {
    const w = parseNum(weight);
    if (w == null) return;
    onSave({
      date,
      weight: w,
      waist: parseNum(waist),
      hips: parseNum(hips),
      thighs: parseNum(thighs),
      biceps: parseNum(biceps),
      chest: parseNum(chest),
    });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Nueva medición</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <Pressable style={styles.dateBtn} onPress={openDatePicker}>
            <Text style={styles.dateLabel}>Fecha</Text>
            <Text style={styles.dateValue}>{formatDateFull(date)}</Text>
          </Pressable>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.row}>
              <Field label="Peso (kg) *" value={weight} onChange={setWeight} />
              <Field label="Pecho (cm)" value={chest} onChange={setChest} />
            </View>
            <View style={styles.row}>
              <Field label="Cintura (cm)" value={waist} onChange={setWaist} />
              <Field label="Cadera (cm)" value={hips} onChange={setHips} />
            </View>
            <View style={styles.row}>
              <Field label="Muslo (cm)" value={thighs} onChange={setThighs} />
              <Field label="Bíceps (cm)" value={biceps} onChange={setBiceps} />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.saveText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryDark,
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
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveText: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
});
