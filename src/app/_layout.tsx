import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { importIncomingUri, takePendingIncomingUri } from '@/services/incomingFile';
import { tryImportIncomingShare } from '@/services/shareService';

export default function RootLayout() {
  const busy = useRef(false);

  useEffect(() => {
    let active = true;

    async function checkIncoming() {
      if (!active || busy.current) return;
      busy.current = true;
      try {
        const uri = takePendingIncomingUri();
        const message = uri ? await importIncomingUri(uri) : await tryImportIncomingShare();
        if (message && active) {
          Alert.alert('Archivo recibido', message);
        }
      } catch (e) {
        if (active) {
          Alert.alert(
            'No se pudo importar',
            e instanceof Error ? e.message : 'El archivo no es válido.'
          );
        }
      } finally {
        busy.current = false;
      }
    }

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkIncoming();
    });

    const urlSub = Linking.addEventListener('url', () => {
      // Pequeño retardo: deja que `redirectSystemPath` guarde la URI entrante.
      setTimeout(checkIncoming, 300);
    });

    const timer = setTimeout(checkIncoming, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
      appStateSub.remove();
      urlSub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="food/new" options={{ title: 'Nuevo alimento' }} />
        <Stack.Screen name="food/[id]" options={{ title: 'Editar alimento' }} />
        <Stack.Screen name="recipe/new" options={{ title: 'Nueva receta' }} />
        <Stack.Screen name="recipe/[id]" options={{ title: 'Receta' }} />
        <Stack.Screen name="recipe/edit/[id]" options={{ title: 'Editar receta' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
