import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { colors } from '@/utils/colors';
import { formatShortDate } from '@/utils/dates';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  color: string;
  points: ChartPoint[];
}

interface ProgressChartProps {
  series: ChartSeries[];
  unit?: string;
  legend?: { label: string; color: string }[];
}

const HEIGHT = 220;
const PADDING_X = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;

export function ProgressChart({ series, unit = '', legend }: ProgressChartProps) {
  const [width, setWidth] = useState(0);

  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Necesitas al menos 2 mediciones para ver la evolución.</Text>
      </View>
    );
  }

  const values = allPoints.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rawRange = max - min;
  const pad = rawRange === 0 ? Math.max(Math.abs(max) * 0.1, 1) : rawRange * 0.2;
  const top = max + pad;
  const bottom = min - pad;
  const span = top - bottom || 1;

  const chartWidth = width - PADDING_X * 2;
  const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const uniqueLabels = Array.from(new Set(allPoints.map((p) => p.label))).sort();

  const xFor = (label: string) => {
    const i = uniqueLabels.indexOf(label);
    if (uniqueLabels.length === 1) return PADDING_X + chartWidth / 2;
    return PADDING_X + (i / (uniqueLabels.length - 1)) * chartWidth;
  };
  const yFor = (v: number) => PADDING_TOP + ((top - v) / span) * chartHeight;

  const gridlines = [top, (top + bottom) / 2, bottom];

  return (
    <View>
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
            <SvgText
              x={PADDING_X}
              y={HEIGHT - PADDING_BOTTOM + 14}
              fontSize={10}
              fill={colors.textTertiary}>
              {Math.round(bottom)}
              {unit}
            </SvgText>

            {series.map((s, si) => {
              const poly = s.points.map((p) => `${xFor(p.label)},${yFor(p.value)}`).join(' ');
              return (
                <G key={si}>
                  {s.points.length >= 2 && (
                    <Polyline points={poly} fill="none" stroke={s.color} strokeWidth={2} />
                  )}
                  {s.points.map((p, pi) => (
                    <Circle
                      key={pi}
                      cx={xFor(p.label)}
                      cy={yFor(p.value)}
                      r={3.5}
                      fill={s.color}
                    />
                  ))}
                </G>
              );
            })}

            <SvgText
              x={PADDING_X}
              y={HEIGHT - 8}
              fontSize={10}
              fill={colors.textSecondary}
              textAnchor="start">
              {formatShortDate(uniqueLabels[0])}
            </SvgText>
            <SvgText
              x={width - PADDING_X}
              y={HEIGHT - 8}
              fontSize={10}
              fill={colors.textSecondary}
              textAnchor="end">
              {formatShortDate(uniqueLabels[uniqueLabels.length - 1])}
            </SvgText>
          </Svg>
        )}
      </View>

      {legend && legend.length > 1 && (
        <View style={styles.legend}>
          {legend.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
