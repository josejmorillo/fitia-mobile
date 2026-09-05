import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/utils/colors';
import {
  EMOJI_CATALOG,
  EMOJI_CATEGORIES,
  searchEmojis,
} from '@/utils/emojiCatalog';

interface EmojiPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
}

const COLUMNS = 8;

export function EmojiPickerModal({ visible, onClose, onPick }: EmojiPickerModalProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(EMOJI_CATEGORIES[0]);
  const [wasVisible, setWasVisible] = useState(false);

  if (visible && !wasVisible) {
    setWasVisible(true);
    setQuery('');
    setCategory(EMOJI_CATEGORIES[0]);
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  const searching = query.trim().length > 0;
  const data = searching
    ? searchEmojis(query).map((e) => e.emoji)
    : EMOJI_CATALOG.filter((e) => e.category === category).map((e) => e.emoji);

  function pick(emoji: string) {
    onPick(emoji);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Elegir emoji</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.search}
            placeholder="Buscar… (ej. pollo, queso, proteina)"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searching && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={styles.clearSearch}>✕</Text>
            </Pressable>
          )}
        </View>

        {!searching && (
          <View style={styles.categories}>
            {EMOJI_CATEGORIES.map((cat) => {
              const active = cat === category;
              return (
                <Pressable
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <FlatList
          data={data}
          key={searching ? 'search' : 'cat'}
          numColumns={COLUMNS}
          keyExtractor={(emoji, i) => `${emoji}-${i}`}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={styles.cell} onPress={() => pick(item)}>
              <Text style={styles.emoji}>{item}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Sin resultados. Prueba con otra palabra.</Text>
          }
        />
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
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  clearSearch: {
    fontSize: 16,
    color: colors.textSecondary,
    padding: 4,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.text,
  },
  chipTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  cell: {
    width: `${100 / COLUMNS}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
  },
});
