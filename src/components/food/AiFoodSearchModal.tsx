import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchFoodByTextAll, type NutritionResult } from '@/services/ai/aiService';
import { getApiKeys } from '@/services/keys';
import { colors } from '@/utils/colors';
import type { NutritionData } from '@/utils/types';

interface AiFoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (data: NutritionData) => void;
}

const PROVIDER_LABEL: Record<string, string> = {
  groq: 'Groq',
  mistral: 'Mistral',
};

export function AiFoodSearchModal({ visible, onClose, onApply }: AiFoodSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NutritionResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [visible]);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    const keys = await getApiKeys();
    const res = await searchFoodByTextAll(query.trim(), keys);
    setLoading(false);

    const anySuccess = res.some((r) => r.success);
    if (!anySuccess) {
      setError(res[0]?.error ?? 'No se pudo obtener información.');
    } else {
      setResults(res);
    }
  }

  function handleUse(data: NutritionData) {
    onApply(data);
    onClose();
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

        {!loading && results.length > 0 && (
          <ScrollView contentContainerStyle={styles.results}>
            {results.map((r) => (
              <View key={r.provider} style={styles.resultCard}>
                <View style={styles.providerBadge}>
                  <Text style={styles.providerText}>{PROVIDER_LABEL[r.provider] ?? r.provider}</Text>
                </View>

                {r.success ? (
                  <>
                    <Text style={styles.resultEmoji}>{r.data.emoji ?? '🍽️'}</Text>
                    <Text style={styles.resultName}>{r.data.name}</Text>
                    {r.data.brand ? <Text style={styles.resultBrand}>{r.data.brand}</Text> : null}
                    <Text style={styles.resultMacros}>
                      {r.data.kcal_100g != null ? `${r.data.kcal_100g} kcal` : '—'} · P{' '}
                      {r.data.protein_g ?? '—'} · C {r.data.carbs_g ?? '—'} · G {r.data.fat_g ?? '—'}{' '}
                      /100g
                    </Text>
                    <Pressable style={styles.applyBtn} onPress={() => handleUse(r.data)}>
                      <Text style={styles.applyText}>Usar este alimento</Text>
                    </Pressable>
                  </>
                ) : (
                  <Text style={styles.resultError}>{r.error}</Text>
                )}
              </View>
            ))}
          </ScrollView>
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
  results: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.iconBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  providerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultEmoji: {
    fontSize: 40,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
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
  resultError: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
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
