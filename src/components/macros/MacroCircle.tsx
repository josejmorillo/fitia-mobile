import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/utils/colors';

interface MacroCircleProps {
  caloriesConsumed: number;
  caloriesGoal: number;
}

const SIZE = 120;
const STROKE_WIDTH = 12;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MacroCircle({ caloriesConsumed, caloriesGoal }: MacroCircleProps) {
  const goal = caloriesGoal > 0 ? caloriesGoal : 1;
  const percentage = Math.min((caloriesConsumed / goal) * 100, 100);
  const remaining = Math.max(goal - caloriesConsumed, 0);
  const margin = 100;
  const isOver = caloriesConsumed > goal + margin;
  const isUnder = caloriesConsumed < goal - margin;

  const strokeColor = isOver ? colors.error : isUnder ? colors.under : colors.success;
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
  const remainingLabel = isOver
    ? `+ ${Math.round(caloriesConsumed - goal)}`
    : `- ${Math.round(remaining)}`;

  return (
    <View style={styles.container}>
      <View style={styles.circleWrap}>
        <Svg width={SIZE} height={SIZE} style={styles.svg}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            stroke={colors.track}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            stroke={strokeColor}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.content}>
          <View style={styles.values}>
            <Text style={styles.consumed}>{Math.round(caloriesConsumed)}</Text>
            <Text style={styles.divider}> / </Text>
            <Text style={styles.goal}>{goal}</Text>
          </View>
          <Text style={styles.label}>kcal</Text>
          <Text style={styles.remaining}>{remainingLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWrap: {
    width: SIZE,
    height: SIZE,
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  values: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  consumed: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 28,
  },
  divider: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  goal: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  label: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginTop: 2,
  },
  remaining: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
    opacity: 0.8,
  },
});
