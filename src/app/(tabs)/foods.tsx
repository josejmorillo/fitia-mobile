import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllFoods } from '@/services/foodService';
import { colors } from '@/utils/colors';
import type { Food } from '@/utils/types';

export default function FoodsScreen() {
  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      getAllFoods().then(setFoods);
    }, [])
  );

  const q = query.toLowerCase();
  const filtered = foods.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.brand ?? '').toLowerCase().includes(q)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Alimentos</Text>
      <TextInput
        style={styles.search}
        placeholder="Buscar alimento..."
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={filtered}
        keyExtractor={(f) => String(f.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({ pathname: '/food/[id]', params: { id: String(item.id) } })
            }>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.macros}>
                {item.caloriesPer100g} kcal · P {item.proteinPer100g} · C {item.carbsPer100g} · G{' '}
                {item.fatPer100g} /100g
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {foods.length === 0
              ? 'Todavía no hay alimentos. Pulsa + para añadir el primero.'
              : 'Sin resultados.'}
          </Text>
        }
      />

      <Pressable style={styles.fab} onPress={() => router.push('/food/new')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
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
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  macros: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: 32,
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
