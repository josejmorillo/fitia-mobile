import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchFoodByText } from '@/services/ai/aiService';
import { getApiKeys } from '@/services/keys';
import { colors } from '@/utils/colors';
import type { NutritionData } from '@/utils/types';

interface AiFoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (data: NutritionData) => void;
}

export function AiFoodSearchModal({ visible, onClose, onApply }: AiFoodSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setQuery('');
    setResult(null);
    setError(null);
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const keys = await getApiKeys();
    const res = await searchFoodByText(query.trim(), keys);
    setLoading(false);
    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Buscar por IA</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Ej. pechuga de pollo Hacendado"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            autoFocus
          />
          <Pressable style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#1A1A1A" />
            ) : (
              <Ionicons name="search" size={20} color="#1A1A1A" />
            )}
          </Pressable>
        </View>

        {loading && (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
            <Text style={styles.stateText}>Consultando…</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.stateWrap}>
            <Ionicons name="warning-outline" size={28} color={colors.textTertiary} />
            <Text style={styles.stateText}>{error}</Text>
          </View>
        )}

        {!loading && result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{result.emoji ?? '🍽️'}</Text>
            <Text style={styles.resultName}>{result.name}</Text>
            {result.brand ? <Text style={styles.resultBrand}>{result.brand}</Text> : null}
            <Text style={styles.resultMacros}>
              {result.kcal_100g != null ? `${result.kcal_100g} kcal` : '—'} · P{' '}
              {result.protein_g ?? '—'} · C {result.carbs_g ?? '—'} · G {result.fat_g ?? '—'} /100g
            </Text>
            <Pressable
              style={styles.applyBtn}
              onPress={() => {
                onApply(result);
                reset();
              }}>
              <Text style={styles.applyText}>Usar este alimento</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  searchBtn: {
    width: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateWrap: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 32,
    gap: 12,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  resultCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  resultEmoji: {
    fontSize: 40,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  resultBrand: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  resultMacros: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  applyBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  applyText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
});
