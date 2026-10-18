import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';

interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  /** Raciones de hidratos ya formateadas (ej. "15,0"). Solo en la barra de carbohidratos. */
  ration?: string;
}

export function MacroBar({ label, consumed, goal, color, ration }: MacroBarProps) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {Math.round(consumed)} / {Math.round(goal)}g
          {ration ? <Text style={styles.ration}> · {ration} R</Text> : null}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  values: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  ration: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
  track: {
    width: '100%',
    height: 6,
    backgroundColor: colors.track,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 9999,
  },
});
