import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';
import { addDays, parseDateString, todayString } from '@/utils/dates';

const ITEM_WIDTH = 56;
const WEEKDAYS_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

interface DaySelectorProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

interface DayCell {
  date: string;
  key: string;
}

const DAYS_BEFORE = 14;
const DAYS_AFTER = 14;

function buildDays(): DayCell[] {
  const today = todayString();
  const days: DayCell[] = [];
  for (let i = -DAYS_BEFORE; i <= DAYS_AFTER; i++) {
    const date = addDays(today, i);
    days.push({ date, key: date });
  }
  return days;
}

export function DaySelector({ selectedDate, onSelect }: DaySelectorProps) {
  const days = buildDays();
  const today = todayString();

  const renderItem = ({ item }: { item: DayCell }) => {
    const d = parseDateString(item.date);
    const isSelected = item.date === selectedDate;
    const isToday = item.date === today;

    return (
      <Pressable
        style={[styles.cell, isSelected && styles.cellSelected]}
        onPress={() => onSelect(item.date)}>
        <Text style={[styles.weekday, isSelected && styles.textSelected]}>
          {isToday ? 'Hoy' : WEEKDAYS_SHORT[d.getDay()]}
        </Text>
        <Text style={[styles.day, isSelected && styles.textSelected]}>{d.getDate()}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={days}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
        initialScrollIndex={DAYS_BEFORE}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cell: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  cellSelected: {
    backgroundColor: colors.primary,
  },
  weekday: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  day: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  textSelected: {
    color: '#FFFFFF',
  },
});
