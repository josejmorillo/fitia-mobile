import { StyleSheet, Text, View } from 'react-native';

export default function BodyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cuerpo</Text>
      <Text style={styles.subtitle}>Mediciones y evolución corporal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
  },
});
