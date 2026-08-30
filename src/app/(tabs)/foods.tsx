import { StyleSheet, Text, View } from 'react-native';

export default function FoodsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alimentos</Text>
      <Text style={styles.subtitle}>Base de datos de alimentos</Text>
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
