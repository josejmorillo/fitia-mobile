import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { lookupBarcode } from '@/services/ai/openFoodFactsService';
import { colors } from '@/utils/colors';
import type { NutritionData } from '@/utils/types';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (data: NutritionData) => void;
}

export function BarcodeScannerModal({ visible, onClose, onApply }: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [wasVisible, setWasVisible] = useState(false);

  if (visible && !wasVisible) {
    setWasVisible(true);
    setScanning(false);
    setStatus(null);
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  async function handleScanned(code: string) {
    if (scanning) return;
    setScanning(true);
    setStatus('Buscando producto…');
    try {
      const data = await lookupBarcode(code);
      if (data) {
        onApply(data);
        onClose();
      } else {
        setStatus('Producto no encontrado. Escanea otro código.');
        setScanning(false);
      }
    } catch {
      setStatus('Error al buscar el producto. Inténtalo de nuevo.');
      setScanning(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.permissionText}>
              Necesitamos acceso a la cámara para escanear códigos de barras.
            </Text>
            <Pressable style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Permitir cámara</Text>
            </Pressable>
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={({ data }) => handleScanned(data)}
          />
        )}

        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.topBar}>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.hint}>Apunta al código de barras</Text>
          </View>

          <View style={styles.centerArea} pointerEvents="none">
            <View style={styles.frame} />
          </View>

          {status && (
            <View style={styles.statusBar}>
              {scanning && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  permissionBtnText: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
  },
  statusBar: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
