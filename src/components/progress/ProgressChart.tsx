import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { colors } from '@/utils/colors';

export interface ChartPoint {
  label: string;
  value: number;
}

interface ProgressChartProps {
  points: ChartPoint[];
  color?: string;
  unit?: string;
}

const HEIGHT = 220;
const PADDING_X = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;

export function ProgressChart({ points, color = colors.primaryDark, unit = 'kg' }: ProgressChartProps) {
  const [width, setWidth] = useState(0);

  if (points.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Necesitas al menos 2 mediciones para ver la evolución.</Text>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rawRange = max - min;
  const pad = rawRange === 0 ? Math.max(Math.abs(max) * 0.1, 1) : rawRange * 0.2;
  const top = max + pad;
  const bottom = min - pad;
  const span = top - bottom || 1;

  const chartWidth = width - PADDING_X * 2;
  const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const xFor = (i: number) => PADDING_X + (i / (points.length - 1)) * chartWidth;
  const yFor = (v: number) => PADDING_TOP + ((top - v) / span) * chartHeight;

  const polyPoints = points.map((p, i) => `${xFor(i)},${yFor(p.value)}`).join(' ');

  const gridlines = [top, (top + bottom) / 2, bottom];

  return (
    <View style={styles.container} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {gridlines.map((g, i) => {
            const y = yFor(g);
            return (
              <Line
                key={i}
                x1={PADDING_X}
                y1={y}
                x2={width - PADDING_X}
                y2={y}
                stroke={colors.track}
                strokeWidth={1}
              />
            );
          })}

          <SvgText x={PADDING_X} y={PADDING_TOP - 4} fontSize={10} fill={colors.textTertiary}>
            {Math.round(top)}
            {unit}
          </SvgText>
          <SvgText x={PADDING_X} y={HEIGHT - PADDING_BOTTOM + 14} fontSize={10} fill={colors.textTertiary}>
            {Math.round(bottom)}
            {unit}
          </SvgText>

          <Polyline points={polyPoints} fill="none" stroke={color} strokeWidth={2} />

          {points.map((p, i) => (
            <Circle key={i} cx={xFor(i)} cy={yFor(p.value)} r={3.5} fill={color} />
          ))}

          <SvgText
            x={PADDING_X}
            y={HEIGHT - 8}
            fontSize={10}
            fill={colors.textSecondary}
            textAnchor="start">
            {points[0].label}
          </SvgText>
          <SvgText
            x={width - PADDING_X}
            y={HEIGHT - 8}
            fontSize={10}
            fill={colors.textSecondary}
            textAnchor="end">
            {points[points.length - 1].label}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
  },
});
