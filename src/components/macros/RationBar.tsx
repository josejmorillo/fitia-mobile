import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/utils/colors';

interface RationBarProps {
  /** Valor de raciones ya formateado (ej. "12,3"). */
  ration: string;
}

/**
 * Barra informativa de raciones de hidratos de carbono. No tiene objetivo ni
 * porcentaje de llenado: solo muestra el total. Estilo claramente distinto al
 * de las barras P/C/G (track punteado, sin relleno).
 */
export function RationBar({ ration }: RationBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Raciones de HC</Text>
        <Text style={styles.value}>{ration} R</Text>
      </View>
      <View style={styles.track} />
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
  value: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
});
