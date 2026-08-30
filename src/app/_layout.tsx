import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="food/new" options={{ title: 'Nuevo alimento' }} />
        <Stack.Screen name="food/[id]" options={{ title: 'Editar alimento' }} />
        <Stack.Screen name="recipe/new" options={{ title: 'Nueva receta' }} />
        <Stack.Screen name="recipe/[id]" options={{ title: 'Editar receta' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
