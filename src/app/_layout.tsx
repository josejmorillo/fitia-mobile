import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { tryImportIncomingShare } from '@/services/shareService';

export default function RootLayout() {
  const checked = useRef(false);

  useEffect(() => {
    let active = true;

    async function checkIncoming() {
      if (!active || checked.current) return;
      try {
        const message = await tryImportIncomingShare();
        if (message) {
          checked.current = true;
          if (active) Alert.alert('Archivo recibido', message);
        }
      } catch {
        // Si el archivo recibido no se puede leer se avisa y se ignora.
        checked.current = true;
      }
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkIncoming();
    });

    const timer = setTimeout(checkIncoming, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
      sub.remove();
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
