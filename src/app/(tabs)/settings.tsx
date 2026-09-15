import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { FormScrollView } from '@/components/common/FormScrollView';
import { ImportPreviewModal } from '@/components/common/ImportPreviewModal';
import { wipeFoodCatalog } from '@/services/foodService';
import { deleteApiKey, getApiKeys, saveApiKey } from '@/services/keys';
import { exportBackup } from '@/services/backupService';
import {
  analyzeBackup,
  importBackupEnvelope,
  importFromText,
  isSqliteFileName,
  parseImportJson,
  pickImportFile,
  readUriText,
  type BackupPayload,
  type ImportPreviewItem,
} from '@/services/shareService';
import { readWebDatabasePayload } from '@/services/webDbImport';
import { colors } from '@/utils/colors';

export default function SettingsScreen() {
  const [groqKey, setGroqKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [hasGroq, setHasGroq] = useState(false);
  const [hasMistral, setHasMistral] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[] | null>(null);
  const [previewPayload, setPreviewPayload] = useState<BackupPayload | null>(null);
  const [importing, setImporting] = useState(false);
  const [wipeVisible, setWipeVisible] = useState(false);

  useEffect(() => {
    getApiKeys().then((k) => {
      setHasGroq(k.groq != null);
      setHasMistral(k.mistral != null);
    });
  }, []);

  async function handleSaveKeys() {
    if (groqKey.trim()) {
      await saveApiKey('groq', groqKey);
      setHasGroq(true);
    }
    if (mistralKey.trim()) {
      await saveApiKey('mistral', mistralKey);
      setHasMistral(true);
    }
    setGroqKey('');
    setMistralKey('');
    setKeysSaved(true);
    setTimeout(() => setKeysSaved(false), 2000);
  }

  async function handleDeleteKey(provider: 'groq' | 'mistral') {
    await deleteApiKey(provider);
    if (provider === 'groq') setHasGroq(false);
    else setHasMistral(false);
  }

  async function handleExportBackup() {
    try {
      await exportBackup();
    } catch {
      Alert.alert('Error', 'No se pudo exportar la copia de seguridad.');
    }
  }

  async function handleImportDatabase() {
    try {
      const picked = await pickImportFile();
      if (picked == null) return;
      console.log('[import] archivo elegido:', picked.name, picked.uri.slice(0, 60));

      let payload: BackupPayload;
      if (isSqliteFileName(picked.name)) {
        payload = await readWebDatabasePayload(picked.uri);
      } else {
        const text = await readUriText(picked.uri);
        const envelope = parseImportJson(text);
        if (envelope.kind !== 'backup') {
          Alert.alert(
            'No se pudo importar',
            'Ese archivo es un alimento o receta. Usa "Importar alimento o receta".'
          );
          return;
        }
        payload = envelope.data;
      }

      const items = await analyzeBackup(payload);
      setPreviewPayload(payload);
      setPreviewItems(items);
    } catch (e) {
      console.error('[import] error analizando la importación:', e);
      Alert.alert(
        'No se pudo importar',
        e instanceof Error ? e.message : 'El archivo no es válido.'
      );
    }
  }

  async function handleConfirmImport(keys: string[]) {
    if (!previewPayload) return;
    setImporting(true);
    try {
      const summary = await importBackupEnvelope(previewPayload, { onlyKeys: keys });
      setPreviewItems(null);
      setPreviewPayload(null);
      Alert.alert('Importación completada', summary.detail ?? '');
    } catch (e) {
      console.error('[import] error importando:', e);
      Alert.alert('No se pudo importar', e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setImporting(false);
    }
  }

  async function handleImportFoodRecipe() {
    try {
      const picked = await pickImportFile();
      if (picked == null) return;
      console.log('[import] archivo elegido:', picked.name, picked.uri.slice(0, 60));
      if (isSqliteFileName(picked.name)) {
        Alert.alert(
          'No se pudo importar',
          'Ese archivo es una base de datos. Usa "Importar BDD".'
        );
        return;
      }
      const text = await readUriText(picked.uri);
      const envelope = parseImportJson(text);
      if (envelope.kind === 'backup') {
        Alert.alert(
          'No se pudo importar',
          'Ese archivo es una copia completa. Usa "Importar BDD".'
        );
        return;
      }
      const message = await importFromText(text);
      Alert.alert('Importación completada', message);
    } catch (e) {
      console.error('[import] error importando alimento/receta:', e);
      Alert.alert(
        'No se pudo importar',
        e instanceof Error ? e.message : 'El archivo no es válido.'
      );
    }
  }

  function handleWipeRequest() {
    Alert.alert(
      'Borrar alimentos y recetas',
      'Vas a borrar TODOS los alimentos, recetas y los registros del diario que los usan. Se conservan tu perfil, objetivos y mediciones. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', style: 'destructive', onPress: () => setWipeVisible(true) },
      ]
    );
  }

  async function handleWipeConfirm() {
    try {
      await wipeFoodCatalog();
      setWipeVisible(false);
      Alert.alert('Hecho', 'Se han borrado todos los alimentos, recetas y registros del diario.');
    } catch (e) {
      console.error('[wipe] error:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo borrar.');
    }
  }

  function showGroqInfo() {
    Alert.alert(
      'Clave de Groq',
      'Para obtenerla gratis (sin tarjeta):\n\n1. Ve a console.groq.com\n2. Regístrate\n3. En "API Keys" pulsa "Create API Key"\n4. Copia la clave (empieza por gsk_)'
    );
  }

  function showMistralInfo() {
    Alert.alert(
      'Clave de Mistral',
      'Para obtenerla gratis (sin tarjeta):\n\n1. Ve a console.mistral.ai\n2. Regístrate\n3. En "API Keys" crea una clave\n4. Cópiala'
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FormScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ajustes</Text>

        <Text style={styles.sectionTitle}>API de IA (opcional)</Text>
        <Text style={styles.hint}>
          Claves para la búsqueda de alimentos por IA. Se guardan de forma segura en tu dispositivo.
          Puedes conseguirlas gratis en console.groq.com y console.mistral.ai.
        </Text>

        <View style={styles.keyHeader}>
          <Text style={[styles.label, styles.keyLabel]}>Clave de Groq</Text>
          {hasGroq && <Text style={styles.savedBadge}>✓ Guardada</Text>}
          <Pressable onPress={showGroqInfo} hitSlop={8}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
        <View style={styles.keyInputRow}>
          <TextInput
            style={[styles.input, styles.keyInput]}
            value={groqKey}
            onChangeText={setGroqKey}
            placeholder={hasGroq ? 'Introduce una nueva clave…' : 'gsk_...'}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          {hasGroq && (
            <Pressable onPress={() => handleDeleteKey('groq')} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
            </Pressable>
          )}
        </View>

        <View style={styles.keyHeader}>
          <Text style={[styles.label, styles.keyLabel]}>Clave de Mistral</Text>
          {hasMistral && <Text style={styles.savedBadge}>✓ Guardada</Text>}
          <Pressable onPress={showMistralInfo} hitSlop={8}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
        <View style={styles.keyInputRow}>
          <TextInput
            style={[styles.input, styles.keyInput]}
            value={mistralKey}
            onChangeText={setMistralKey}
            placeholder={hasMistral ? 'Introduce una nueva clave…' : '...'}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          {hasMistral && (
            <Pressable onPress={() => handleDeleteKey('mistral')} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
            </Pressable>
          )}
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSaveKeys}>
          <Text style={styles.saveText}>{keysSaved ? 'Claves guardadas ✓' : 'Guardar claves'}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Datos y copias de seguridad</Text>
        <Text style={styles.hint}>
          Copia de seguridad completa (alimentos, recetas, diario, mediciones y perfil) o
          importación de alimentos y recetas sueltos. La copia completa acepta también la base de
          datos (.db) de la versión web, de la que se importan alimentos y recetas.
        </Text>

        <Text style={styles.subSectionTitle}>Copia de seguridad (base de datos)</Text>
        <View style={styles.dataRow}>
          <Pressable style={[styles.dataBtn, styles.dataBtnPrimary]} onPress={handleExportBackup}>
            <Ionicons name="share-outline" size={18} color="#1A1A1A" />
            <Text style={styles.dataBtnText}>Exportar BDD</Text>
          </Pressable>
          <Pressable style={[styles.dataBtn, styles.dataBtnGhost]} onPress={handleImportDatabase}>
            <Ionicons name="download-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.dataBtnGhostText}>Importar BDD</Text>
          </Pressable>
        </View>

        <Text style={styles.subSectionTitle}>Alimentos y recetas</Text>
        <Pressable
          style={[styles.dataBtn, styles.dataBtnGhost, styles.dataBtnFull]}
          onPress={handleImportFoodRecipe}>
          <Ionicons name="download-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.dataBtnGhostText}>Importar alimento o receta</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Zona peligrosa</Text>
        <Text style={styles.hint}>
          Borra todos los alimentos y recetas (y los registros del diario que los usan). Se
          conservan tu perfil, objetivos y mediciones.
        </Text>
        <Pressable style={[styles.dataBtn, styles.dangerBtn]} onPress={handleWipeRequest}>
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          <Text style={styles.dangerText}>Borrar alimentos y recetas</Text>
        </Pressable>
      </FormScrollView>

      <ImportPreviewModal
        items={previewItems}
        loading={importing}
        onClose={() => {
          setPreviewItems(null);
          setPreviewPayload(null);
        }}
        onConfirm={handleConfirmImport}
      />

      <ConfirmDeleteModal
        visible={wipeVisible}
        title="Borrar alimentos y recetas"
        warning="Vas a borrar TODOS los alimentos, recetas y los registros del diario. Se conservan tu perfil, objetivos y mediciones. Esta acción no se puede deshacer."
        onClose={() => setWipeVisible(false)}
        onConfirm={handleWipeConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  keyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 6,
  },
  keyLabel: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
  },
  savedBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  keyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  keyInput: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '700',
  },
  dataRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 14,
    marginBottom: 6,
  },
  dataBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
  },
  dataBtnFull: {
    marginTop: 4,
  },
  dataBtnPrimary: {
    backgroundColor: colors.primary,
  },
  dataBtnGhost: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dangerBtn: {
    backgroundColor: '#C62828',
    marginTop: 4,
  },
  dangerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dataBtnText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  dataBtnGhostText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
